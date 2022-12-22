import { createBlankQuery } from "../../helpers";
import { ElasticsearchBoolQueryConfig } from "~/types";
import { ElasticsearchQueryBuilderOperatorNotBetweenPlugin } from "~/plugins/operator";

describe("ElasticsearchQueryBuilderOperatorNotBetweenPlugin", () => {
    const plugin = new ElasticsearchQueryBuilderOperatorNotBetweenPlugin();

    it("should apply not between range correctly", () => {
        const query = createBlankQuery();

        plugin.apply(query, {
            name: "id",
            path: "id",
            basePath: "id",
            value: [100, 200],
            keyword: false
        });

        const expected: ElasticsearchBoolQueryConfig = {
            must_not: [
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
            filter: [],
            should: []
        };
        expect(query).toEqual(expected);
    });
});
