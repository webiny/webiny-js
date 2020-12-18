import { elasticSearchQueryBuilderNotBetweenPlugin } from "../../../src/content/plugins/es/elasticSearchQueryBuilderNotBetweenPlugin";
import { createBlankQuery } from "./helpers";

describe("elasticSearchQueryBuilderNotBetweenPlugin", () => {
    const plugin = elasticSearchQueryBuilderNotBetweenPlugin();

    it("should apply not between range correctly", () => {
        const query = createBlankQuery();

        plugin.apply(query, {
            field: "id",
            value: [100, 200]
        });
        expect(query).toEqual({
            range: [],
            mustNot: [
                {
                    range: {
                        "id.keyword": {
                            lte: 200,
                            gte: 100
                        }
                    }
                }
            ],
            must: [],
            match: []
        });
    });
});
