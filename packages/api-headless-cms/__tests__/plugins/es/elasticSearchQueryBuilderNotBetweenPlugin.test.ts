import { elasticSearchQueryBuilderNotBetweenPlugin } from "../../../src/content/plugins/es/elasticSearchQueryBuilderNotBetweenPlugin";
import { createBlankQuery } from "./helpers";
import { ElasticSearchQuery } from "@webiny/api-headless-cms/types";

describe("elasticSearchQueryBuilderNotBetweenPlugin", () => {
    const plugin = elasticSearchQueryBuilderNotBetweenPlugin();

    it("should apply not between range correctly", () => {
        const query = createBlankQuery();

        plugin.apply(query, {
            field: "id",
            value: [100, 200]
        });

        const expected: ElasticSearchQuery = {
            mustNot: [
                {
                    range: {
                        id: {
                            lte: 200,
                            gte: 100
                        }
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
