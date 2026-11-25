/**
 * Before performing the query, we need to escape all special characters.
 * @see https://opensearch.org/docs/latest/query-dsl/full-text/query-string/
 */

const specialCharactersToRemove = [`\\?`];

/**
 * The standard analyzer splits words on these, so "11/14" is indexed as "11" and "14". Wildcard
 * terms are not analyzed, so "11\/14*" would look for a single word that does not exist. Searching
 * for the parts as separate words matches what was indexed.
 */
const specialCharacterToSpace = ["-", "\\\\", "/"];

const specialCharacters = [
    "\\\\",
    "\\+",
    // "\\-",
    "\\=",
    `&`,
    `\\|`,
    ">",
    "<",
    `!`,
    "\\(",
    "\\)",
    "\\{",
    "\\}",
    "\\[",
    "\\]",
    "\\^",
    '\\"',
    "\\~",
    "\\*",
    `:`,
    "\\#"
];

export const normalizeValue = (value: string) => {
    let result = value || "";
    if (!result) {
        return result;
    }
    for (const character of specialCharactersToRemove) {
        result = result.replace(new RegExp(character, "g"), "");
    }
    for (const character of specialCharacterToSpace) {
        result = result.replace(new RegExp(character, "g"), " ");
    }

    for (const character of specialCharacters) {
        result = result.replace(new RegExp(character, "g"), `\\${character}`);
    }

    /**
     * The query string syntax reads uppercase AND, OR and NOT as operators, so "Terms AND/OR
     * conditions" would fail to parse and "Rock/NOT/Roll" would exclude "Roll". The analyzer
     * lowercases indexed words anyway, so lowercasing them makes them plain words to search for.
     */
    result = result.replace(/\b(AND|OR|NOT)\b/g, operator => operator.toLowerCase());

    return result || "";
};

const hasSpecialChar = (value: string): boolean | null => {
    if (!value) {
        return null;
    }
    return value.match(/^([0-9a-zA-Z]+)$/i) === null;
};

export const normalizeValueWithAsterisk = (initial: string) => {
    const value = normalizeValue(initial);
    const results = value.split(" ");

    let result = value;
    /**
     * If the first word has an escaped special character, do not put asterisk in front of it.
     */
    const firstWord = results[0];
    if (hasSpecialChar(firstWord) === false) {
        result = `*${result}`;
    }
    /**
     * If the last word has an escaped special character, do not put asterisk at the end of it.
     */
    const lastWord = results[results.length - 1];
    if (hasSpecialChar(lastWord) === false) {
        result = `${result}*`;
    }

    return result;
};
