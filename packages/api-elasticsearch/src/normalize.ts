/**
 * Before performing the query, we need to escape all special characters.
 * @see https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-query-string-query.html#_reserved_characters
 */

const RESERVED_CHARACTERS = {
    // These characters need to be escaped with backslash ("\").
    escape: [
        "\\\\",
        "\\/",
        "\\+",
        "\\-",
        "\\=",
        "\\&\\&",
        "\\|\\|",
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
        "\\>",
        "\\<"
    ]
};

export const normalizeValue = (value: string) => {
    let result = value;
    for (const character of RESERVED_CHARACTERS.escape) {
        result = result.replace(new RegExp(`${character}`, "g"), ` `);
    }

    return result ? `*${result}*` : "";
};
