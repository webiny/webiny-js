import { createBlankQuery } from "../../helpers";
import { ElasticsearchBoolQueryConfig } from "@webiny/api-elasticsearch/types";
import { ElasticsearchQueryBuilderOperatorNotBetweenPlugin } from "~/plugins/operator";

describe("ElasticsearchQueryBuilderOperatorNotBetweenPlugin", () => {
    const plugin = new ElasticsearchQueryBuilderOperatorNotBetweenPlugin();
    const context: any = {};

    it("should apply not between range correctly", () => {
        const query = createBlankQuery();

        plugin.apply(query, {
            path: "id",
            value: [100, 200],
            context
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
