import { elasticSearchQueryBuilderNotPlugin } from "../../../src/content/plugins/es/elasticSearchQueryBuilderNotPlugin";
import { createBlankQuery } from "./helpers";
import { ElasticsearchQuery } from "../../../src/types";

describe("elasticSearchQueryBuilderNotPlugin", () => {
    const plugin = elasticSearchQueryBuilderNotPlugin();

    const context: any = {};

    it("should apply not correctly", () => {
        const query = createBlankQuery();

        plugin.apply(query, {
            field: "name",
            value: "John",
            context
        });
        const expected: ElasticsearchQuery = {
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
