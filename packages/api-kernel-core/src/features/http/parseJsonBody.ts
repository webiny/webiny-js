/**
 * Parses a JSON request body like `JSON.parse`, but throws a `SyntaxError` when the input contains a
 * `__proto__` or `constructor.prototype` key, so a parsed body can't pollute object prototypes when
 * it is later merged into another object. Same rule as `parseJson` in `@webiny/utils`, without the
 * dependency.
 */
export const parseJsonBody = (text: string): any => {
    return JSON.parse(text, function (key, value) {
        if (key === "__proto__") {
            throw new SyntaxError("Object contains forbidden prototype property");
        }
        if (
            key === "constructor" &&
            value &&
            typeof value === "object" &&
            Object.prototype.hasOwnProperty.call(value, "prototype")
        ) {
            throw new SyntaxError("Object contains forbidden prototype property");
        }
        return value;
    });
};
