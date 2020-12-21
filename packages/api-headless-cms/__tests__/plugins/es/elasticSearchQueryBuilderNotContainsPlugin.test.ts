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
                    simple_query_string: {
                        fields: ["name"],
                        query: "John",
                        operator: "AND"
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
