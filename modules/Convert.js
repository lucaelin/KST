class Convert {}
Convert.radToDeg = async (rad)=>(((await rad > 0 ? 0 : 2*Math.PI) + await rad) * 180 / Math.PI);
Convert.degToRad = async (deg)=>(((await deg > 0 ? 0 : 360) + await deg) * Math.PI / 180);
Convert.add = async (a, b)=>await a + await b;
Convert.sub = async (a, b)=>await a - await b;
Convert.mul = async (a, b)=>await a * await b;
Convert.div = async (a, b)=>await a / await b;
Convert.SI = async (v)=>{
  v = await v;
  if(!Number.isFinite(v)) return v.toString();
  let prefix = '';
  let sign = Math.sign(v);
  v = Math.abs(v);

  if(v>1) {
    let prefixes = ['k', 'M', 'G', 'T', 'P', 'E'];
    for(let i in prefixes) {
      if(v < 1000) break;
      prefix = prefixes[i];
      v = v / 1000;
    }
  } else {
    let prefixes = ['m', 'μ', 'n', 'p', 'f', 'a'];
    for(let i in prefixes) {
      if(v > 1.) break;
      prefix = prefixes[i];
      v = v * 1000;
    }
  }

  return (sign*v).toFixed(3) + '\u00A0' + prefix;
};
Convert.time = async (v)=>{
  v = await v;
  if(!Number.isFinite(v)) return v.toString();
  v *= 1000;
  let sign = Math.sign(v);
  v = Math.abs(v);
  let steps = [     1000,  60,  60,   6,        426,   Infinity];
  let names = ['\u00A0s', '.', ':', ':', '\u00A0d ', '\u00A0y '];
  let onDemand = [false, false, false, false,  true,       true];
  let s = '';
  let mod = 0;
  for(let i in steps) {
    mod = steps[i];
    let val = Math.round(v)%mod;
    if(val > 0 || !onDemand[i]) {
      val = val.toString();
      val = val.padStart(Number.isFinite(mod)?(mod-1).toString().length:0,'0');
      s = val + names[i] + s;
    }
    v = Math.floor(v/mod);
  }
  return sign>0?''+s:'-'+s;
};
export default Convert;
