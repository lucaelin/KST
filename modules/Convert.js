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
  let steps = [  1000,  60,    60,         6,    426];
  let names = ['\u00A0s', '.', ':', ':', '\u00A0d '];
  let s = '';
  let mod = 0;
  for(let i in steps) {
    mod = steps[i];
    let val = Math.round(v%mod);
    s = val.toString().padStart((mod-1).toString().length,'0') + names[i] + s;
    v = Math.floor(v/mod);
  }
  let years = v>0?v+'\u00A0y ':'';
  s = years + s;
  return s;
};
export default Convert;
