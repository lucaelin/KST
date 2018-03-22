export class Path {
  constructor(target, path, processor) {
    this.path = path;
    this.target = target;
    this.tree = {};
    this.leaf = {};
    this.process = processor?processor:(v)=>v;
    this.streams = [];

    this.buildTree(this.target, this.path);
  }
  get value() {
    if(typeof this._value !== 'undefined') return this._value;
    let s;
    return new Promise((res)=>{
      s = this.stream('value',res);
    }).then(()=>{
      s.remove();
      return this._value;
    });
  }
  async callback(v) {
    this._value = await this.process(v);
    this.streams.forEach((f)=>{
      try {f(this._value);} catch(e) {console.error(e);}
    });
  }
  stream(s, onUpdate) { // s is there to keep compatibility, but path can only stream value so s should always be value
    this.streams.push(onUpdate);
    return {
      remove: async ()=>{
        this.streams = this.streams.filter((v)=>v!==onUpdate);
      }
    };
  }

  /*
    this.tree = {
      name: 'spaceCenter',
      stream: Stream{id: w, handler: refresh, remove: ()=>...},
      value: Service{name: 'spaceCenter', ...},
      child: {
        name: 'activeVessel',
        stream: Stream{id: x, handler: refresh, remove: ()=>...},
        value: Class{name:'Vessel', ...}
        child: {
          name: 'orbit',
          stream: Stream{id: y, handler: refresh, remove: ()=>...},
          value: Class{name:'Obrit', ...}
          child: {
            name: 'semiMajorAxis',
            stream: Stream{id: z, handler: refresh, remove: ()=>...},
            value: 100000,
          },
        },
      },
    }
  */
  async buildTree(target, path) {
    this.tree = {value: target};
    if(typeof target.remove === 'function') this.tree.stream = target;
    if(!target) throw new Error('No tree to build!');

    this.leaf = await path.split('.').filter((p)=>p).reduce(async (leaf, property)=>{
      leaf = await leaf;
      if(!leaf.value) throw new Error('Could not build tree: '+path);

      leaf.child = {};

      leaf.child.name = property;
      if (typeof leaf.value.stream === 'function') {
        leaf.child.stream = await leaf.value.stream(leaf.child.name, (v)=>this.refresh(leaf.child, v));
      } else {
        console.warn(leaf, 'unstreamable');
      }
      leaf.child.value = await leaf.value[leaf.child.name];

      return leaf.child;
    }, this.tree);

    this.leaf.callback = true;
    await this.callback(this.leaf.value);
  }
  async refresh(tree, value) {
    if(!tree) return this.remove();
    if(tree.value === value) return;
    tree.value = value;
    if (tree.callback) this.callback(tree.value);
    if (tree.child) {
      if (tree.child.stream) {
        tree.child.stream.remove();
        delete tree.child.stream;
      }
      if(typeof tree.value !== 'undefined') {
        if (typeof tree.value.stream === 'function') {
          tree.child.stream = await tree.value.stream(tree.child.name, (v)=>this.refresh(tree.child, v));
        } else {
          let newVal = await tree.value[tree.child.name];
          if(tree.child.value !== newVal) {
            tree.child.value = newVal;
            if (tree.child.callback) this.callback(tree.child.value);
          }
        }
      } else {
        this.remove(tree.child, true);
      }
    }
  }
  remove(tree, safe) {
    if(!this.leaf.callback) throw new Error('Tree not build yet');
    tree = tree?tree:this.tree;
    this.streams = [];

    if(tree.stream) {
      let s = tree.stream;
      delete tree.stream;
      s.remove();
    }
    if(tree.child) {
      this.remove(tree.child, safe);
      if(!safe) {
        delete tree.child;
      }
    }
  }
}

export class MultiPath {
  constructor(target, paths, processor) {
    this.streams = [];
    this.process = processor?processor:(v)=>v;
    this.callback = async ()=>{
      this._value = await this.process(await Promise.all(this.paths.map(async (p)=>await p.value)));
      this.streams.forEach((f)=>{
        try {f(this._value);} catch(e) {console.error(e);}
      });
    };
    this.paths = paths.map((p)=>new Path(target, p));
    this.paths.forEach((p)=>p.stream('value',this.callback));
  }
  get value() {
    if(typeof this._value !== 'undefined') return this._value;
    let s;
    return new Promise((res)=>{
      s = this.stream('value',res);
    }).then(()=>{
      s.remove();
      return this._value;
    });
  }
  stream(s, onUpdate) { // s is there to keep compatibility, but path can only stream value so s should always be value
    this.streams.push(onUpdate);
    return {
      remove: async ()=>{
        this.streams = this.streams.filter((v)=>v!==onUpdate);
      }
    };
  }
  async remove() {
    this.streams = [];
    await this.paths.map(async (p)=>await p.remove());
    this.paths = [];
  }
}

window.Path = Path;
window.MultiPath = MultiPath;
