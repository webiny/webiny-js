import { elasticSearchQueryBuilderNotPlugin } from "../../../src/content/plugins/es/elasticSearchQueryBuilderNotPlugin";
import { createBlankQuery } from "./helpers";
import { ElasticSearchQuery } from "@webiny/api-headless-cms/types";

describe("elasticSearchQueryBuilderNotPlugin", () => {
    const plugin = elasticSearchQueryBuilderNotPlugin();

    it("should apply not correctly", () => {
        const query = createBlankQuery();

        plugin.apply(query, {
            field: "name",
            value: "John"
        });
        const expected: ElasticSearchQuery = {
            mustNot: [
                {
                    term: {
                        "name.keyword": "John"
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
