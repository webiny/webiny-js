import { elasticsearchOperatorNotPlugin } from "../../../../src/elasticsearch/operators/not";
import { createBlankQuery } from "../helpers";
import { ElasticsearchQuery } from "@webiny/api-plugin-elastic-search-client/types";

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
        const expected: ElasticsearchQuery = {
            mustNot: [
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
