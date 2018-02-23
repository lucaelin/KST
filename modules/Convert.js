class Convert {}
Convert.radToDeg = async (rad)=>((await rad > 0 ? 0 : 2*Math.PI) + await rad) * 180 / Math.PI;
Convert.degToRad = async (deg)=>((await deg > 0 ? 0 : 360) + await deg) * Math.PI / 180;
Convert.add = async (a, b)=>await a + await b;
Convert.sub = async (a, b)=>await a - await b;
Convert.mul = async (a, b)=>await a * await b;
Convert.div = async (a, b)=>await a / await b;
export default Convert;
