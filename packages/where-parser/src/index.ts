/* eslint-disable */
const AND_SYNTAX = "AND";
const OR_SYNTAX = "OR";
const SYNTAX_KEYS = [AND_SYNTAX, OR_SYNTAX];

const parseFilter = (key: string, value: any) => {};

export const transform = (where: Record<string, any>): Record<string, any> => {
    const keys = Object.keys(where);

    return keys.reduce((collection, key) => {
        let syntaxKey;
        if (keys.length === 1) {
            syntaxKey = SYNTAX_KEYS.includes(key) === true ? key : AND_SYNTAX;
        }

        collection[syntaxKey] = parseFilter(key, where[key]);

        return collection;
    }, {});
};
