const Pages = [];
class Page {
  constructor() {
    Pages.push(this);
    this.dom = document.createElement('div');
    this.dom.style.display = 'none';
    this.dom.style.opacity = 0;
    this.isHidden = true;
    this.dom.style.transition = 'opacity 0.3s';
    document.querySelector('#mainview').appendChild(this.dom);
  }
  show(prev) {
    if(!this.isHidden) return;
    this.isHidden = false;
    if(prev) {
      prev.hide(true);
      this.prev = prev;
    }
    this.dom.style.display = 'block';
    window.requestAnimationFrame(()=>this.dom.style.opacity = 1);

  }
  hide(sub) {
    if(this.isHidden) return;
    this.isHidden = true;
    this.dom.style.opacity = 0;
    window.setTimeout(()=>this.dom.style.display = 'none', 300);
    if(!sub && this.prev) {
      this.prev.show();
    }
  }
}

export default Page;
