import { describe, expect, it } from "vitest";
import { createBlankQuery } from "../../helpers";
import { OpenSearchBoolQueryConfig } from "~/types.js";
import { OpenSearchQueryBuilderOperatorContainsPlugin } from "~/plugins/operator/index.js";

describe("OpenSearchQueryBuilderOperatorContainsPlugin", () => {
    const plugin = new OpenSearchQueryBuilderOperatorContainsPlugin();

    it("should apply contains correctly", () => {
        const query = createBlankQuery();

        plugin.apply(query, {
            name: "name",
            path: "name.keyword",
            basePath: "name",
            value: "John",
            keyword: true
        });

        plugin.apply(query, {
            name: "name",
            path: "name.keyword",
            basePath: "name",
            value: "Doe",
            keyword: true
        });

        const expected: OpenSearchBoolQueryConfig = {
            must_not: [],
            must: [
                {
                    query_string: {
                        allow_leading_wildcard: true,
                        default_operator: "and",
                        fields: ["name"],
                        query: "*John*"
                    }
                },
                {
                    query_string: {
                        allow_leading_wildcard: true,
                        default_operator: "and",
                        fields: ["name"],
                        query: "*Doe*"
                    }
                }
            ],
            filter: [],
            should: []
        };
        expect(query).toEqual(expected);
    });
});
