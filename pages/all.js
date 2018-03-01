
const e = {}

import('./vessel.js').then((module)=>e.vessel = module.default());

export default e;
