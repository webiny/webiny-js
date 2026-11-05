import secureJsonParse from "secure-json-parse";

/**
 * Parses JSON like `JSON.parse`, but throws a `SyntaxError` when the input contains a
 * `__proto__` or `constructor.prototype` key, so parsed input can't pollute object prototypes.
 *
 * Use it instead of `JSON.parse` for anything a user can influence: request bodies,
 * cursors, websocket messages, stored values.
 */
// Returns `any`, like `JSON.parse`, so it can replace it anywhere without type changes.
export const parseJson = (text: string): any => {
    return secureJsonParse(text, {
        protoAction: "error",
        constructorAction: "error"
    });
};
