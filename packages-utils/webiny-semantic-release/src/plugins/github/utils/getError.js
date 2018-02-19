import ERROR_DEFINITIONS from "./errors";

export default (code, ctx = {}) => {
    const { message, details } = ERROR_DEFINITIONS[code](ctx);
    return new Error(`${code}: ${message}\n${details}`);
};
