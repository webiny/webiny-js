import { describe, expect, it } from "vitest";
import { createBlankQuery } from "../../helpers";
import { OpenSearchBoolQueryConfig } from "~/types.js";
import { OpenSearchQueryBuilderOperatorNotContainsPlugin } from "~/plugins/operator/index.js";

describe("OpenSearchQueryBuilderOperatorNotContainsPlugin", () => {
    const plugin = new OpenSearchQueryBuilderOperatorNotContainsPlugin();

    it("should apply not contains correctly", () => {
        const query = createBlankQuery();

        plugin.apply(query, {
            name: "name",
            path: "name.keyword",
            basePath: "name",
            value: "John",
            keyword: true
        });
        const expected: OpenSearchBoolQueryConfig = {
            must_not: [
                {
                    query_string: {
                        allow_leading_wildcard: true,
                        fields: ["name"],
                        query: "*John*",
                        default_operator: "and"
                    }
                }
            ],
            must: [],
            filter: [],
            should: []
        };
        expect(query).toEqual(expected);
    });
});
