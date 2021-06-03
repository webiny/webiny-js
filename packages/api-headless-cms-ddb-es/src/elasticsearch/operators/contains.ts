/**
 * Before performing the query, we need to escape all special characters.
 * @see https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-query-string-query.html#_reserved_characters
 */
import { ElasticsearchQueryBuilderPlugin } from "../../types";

const ES_RESERVED_CHARACTERS = {
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
    for (let i = 0; i < ES_RESERVED_CHARACTERS.escape.length; i++) {
        const character = ES_RESERVED_CHARACTERS.escape[i];

        result = result.replace(new RegExp(`${character}`, "g"), ` `);
    }

    return result ? `*${result}*` : "";
};

export const elasticsearchOperatorContainsPlugin = (): ElasticsearchQueryBuilderPlugin => ({
    type: "cms-elastic-search-query-builder",
    name: "elastic-search-query-builder-contains",
    operator: "contains",
    apply(query, { field, value }) {
        query.must.push({
            query_string: {
                allow_leading_wildcard: true,
                fields: [field],
                query: normalizeValue(value),
                // @ts-ignore
                default_operator: "AND"
            }
        });
    }
});
