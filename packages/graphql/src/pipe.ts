export default (...fns) => x => fns.reduce((v, f) => f(v), x);
