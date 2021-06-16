import { elasticsearchOperatorNotPlugin } from "../../../../src/elasticsearch/operators/not";
import { createBlankQuery } from "../helpers";
import { ElasticsearchBoolQueryConfig } from "@webiny/api-elasticsearch/types";

describe("elasticsearchOperatorNotPlugin", () => {
    const plugin = elasticsearchOperatorNotPlugin();

    const context: any = {};

    it("should apply not correctly", () => {
        const query = createBlankQuery();

        plugin.apply(query, {
            field: "name",
            value: "John",
            context
        });
        const expected: ElasticsearchBoolQueryConfig = {
            must_not: [
                {
                    term: {
                        "name.keyword": "John"
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
