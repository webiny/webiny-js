import { elasticSearchQueryBuilderContainsPlugin } from "../../../src/content/plugins/es/elasticSearchQueryBuilderContainsPlugin";
import { createBlankQuery } from "./helpers";
import { ElasticsearchQuery } from "@webiny/api-headless-cms/types";

describe("elasticSearchQueryBuilderContainsPlugin", () => {
    const plugin = elasticSearchQueryBuilderContainsPlugin();

    it("should apply contains correctly", () => {
        const query = createBlankQuery();

        plugin.apply(query, {
            field: "name",
            value: "John"
        });

        plugin.apply(query, {
            field: "name",
            value: "Doe"
        });

        const expected: ElasticsearchQuery = {
            mustNot: [],
            must: [
                {
                    query_string: {
                        allow_leading_wildcard: true,
                        fields: ["name"],
                        query: "*John*"
                    }
                },
                {
                    query_string: {
                        allow_leading_wildcard: true,
                        fields: ["name"],
                        query: "*Doe*"
                    }
                }
            ],
            match: [],
            should: []
        };
        expect(query).toEqual(expected);
    });
});
