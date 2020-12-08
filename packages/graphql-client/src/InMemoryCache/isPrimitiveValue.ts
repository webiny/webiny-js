// For now, a primitive implementation.
const PRIMITIVE_TYPES = ["string", "number", "boolean"];
export default value => value === null || PRIMITIVE_TYPES.includes(typeof value);
