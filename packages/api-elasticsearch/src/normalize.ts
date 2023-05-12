/**
 * Before performing the query, we need to escape all special characters.
 * @see https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-query-string-query.html#_reserved_characters
 */

const specialCharacterToSpace = ["-"];

const specialCharacters = [
    "\\\\",
    "\\+",
    // "\\-",
    "\\=",
    "\\&\\&",
    "\\|\\|",
    ">",
    "<",
    "\\!",
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
    "\\?",
    "\\:",
    "\\/",
    "\\#"
];

export const normalizeValue = (value: string) => {
    let result = value || "";
    for (const character of specialCharacterToSpace) {
        result = result.replace(new RegExp(character, "g"), " ");
    }

    for (const character of specialCharacters) {
        result = result.replace(new RegExp(character, "g"), `\\${character}`);
    }

    return result || "";
};
