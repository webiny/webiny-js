import { elasticsearchOperatorEqualPlugin } from "../../../../src/elasticsearch/operators/equal";
import { createBlankQuery } from "../helpers";
import { ElasticsearchQuery } from "@webiny/api-plugin-elastic-search-client/types";

describe("elasticsearchOperatorEqualPlugin", () => {
    const plugin = elasticsearchOperatorEqualPlugin();
    const context: any = {};

    it("should apply must correctly", () => {
        const query = createBlankQuery();

        plugin.apply(query, {
            field: "name",
            value: "John",
            context
        });

        plugin.apply(query, {
            field: "name",
            value: "Doe",
            context
        });

        const expected: ElasticsearchQuery = {
            mustNot: [],
            must: [
                {
                    term: {
                        "name.keyword": "John"
                    }
                },
                {
                    term: {
                        "name.keyword": "Doe"
                    }
                }
            ],

            should: []
        };

        expect(query).toEqual(expected);
    });
});
