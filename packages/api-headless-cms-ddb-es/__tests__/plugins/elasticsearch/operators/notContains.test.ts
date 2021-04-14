import { elasticsearchOperatorNotContainsPlugin } from "../../../../src/elasticsearch/operators/notContains";
import { createBlankQuery } from "../helpers";
import { ElasticsearchQuery } from "../../../../src/types";

describe("elasticsearchOperatorNotContainsPlugin", () => {
    const plugin = elasticsearchOperatorNotContainsPlugin();
    const context: any = {};

    it("should apply not contains correctly", () => {
        const query = createBlankQuery();

        plugin.apply(query, {
            field: "name",
            value: "John",
            context
        });
        const expected: ElasticsearchQuery = {
            mustNot: [
                {
                    query_string: {
                        allow_leading_wildcard: true,
                        fields: ["name"],
                        query: "*John*"
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
