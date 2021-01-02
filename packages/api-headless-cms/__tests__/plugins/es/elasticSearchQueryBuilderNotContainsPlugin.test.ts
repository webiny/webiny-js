import { elasticSearchQueryBuilderNotContainsPlugin } from "../../../src/content/plugins/es/elasticSearchQueryBuilderNotContainsPlugin";
import { createBlankQuery } from "./helpers";
import { ElasticSearchQueryType } from "@webiny/api-headless-cms/types";

describe("elasticSearchQueryBuilderNotContainsPlugin", () => {
    const plugin = elasticSearchQueryBuilderNotContainsPlugin();

    it("should apply not contains correctly", () => {
        const query = createBlankQuery();

        plugin.apply(query, {
            field: "name",
            value: "John"
        });
        const expected: ElasticSearchQueryType = {
            mustNot: [
                {
                    // eslint-disable-next-line @typescript-eslint/camelcase
                    query_string: {
                        // eslint-disable-next-line @typescript-eslint/camelcase
                        allow_leading_wildcard: true,
                        fields: ["name"],
                        query: "John"
                    }
                }
            ],
            must: [],
            match: [],
            should: []
        };
        expect(query).toEqual(expected);
    });
});
