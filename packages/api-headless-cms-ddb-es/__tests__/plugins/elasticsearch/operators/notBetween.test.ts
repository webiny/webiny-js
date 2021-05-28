import { elasticsearchOperatorNotBetweenPlugin } from "../../../../src/elasticsearch/operators/notBetween";
import { createBlankQuery } from "../helpers";
import { ElasticsearchQuery } from "../../../../src/types";

describe("elasticsearchOperatorNotBetweenPlugin", () => {
    const plugin = elasticsearchOperatorNotBetweenPlugin();
    const context: any = {};

    it("should apply not between range correctly", () => {
        const query = createBlankQuery();

        plugin.apply(query, {
            field: "id",
            value: [100, 200],
            context
        });

        const expected: ElasticsearchQuery = {
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
