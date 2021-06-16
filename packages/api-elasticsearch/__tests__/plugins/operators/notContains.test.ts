import { createBlankQuery } from "../../helpers";
import { ElasticsearchBoolQueryConfig } from "~/types";
import { ElasticsearchQueryBuilderOperatorNotContainsPlugin } from "~/plugins/operator";

describe("ElasticsearchQueryBuilderOperatorNotContainsPlugin", () => {
    const plugin = new ElasticsearchQueryBuilderOperatorNotContainsPlugin();
    const context: any = {};

    it("should apply not contains correctly", () => {
        const query = createBlankQuery();

        plugin.apply(query, {
            path: "name",
            value: "John",
            context
        });
        const expected: ElasticsearchBoolQueryConfig = {
            must_not: [
                {
                    query_string: {
                        allow_leading_wildcard: true,
                        fields: ["name"],
                        query: "*John*",
                        default_operator: "and"
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
