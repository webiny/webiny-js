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
    `\/`,
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

export const normalizeValueWithAsterisk = (initial: string) => {
    const value = normalizeValue(initial);
    const results = value.split(" ");

    let result = value;
    /**
     * If there is a / in the first word, do not put asterisk in front of it.
     */
    const firstWord = results[0];
    if (firstWord && firstWord.includes("/") === false) {
        result = `*${result}`;
    }
    /**
     * If there is a / in the last word, do not put asterisk at the end of it.
     */
    const lastWord = results[results.length - 1];
    if (lastWord && lastWord.includes("/") === false) {
        result = `${result}*`;
    }

    return result;
};
