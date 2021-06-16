import { createBlankQuery } from "../../helpers";
import { ElasticsearchBoolQueryConfig } from "~/types";
import { ElasticsearchQueryBuilderOperatorContainsPlugin } from "~/plugins/operator";

describe("ElasticsearchQueryBuilderOperatorContainsPlugin", () => {
    const plugin = new ElasticsearchQueryBuilderOperatorContainsPlugin();
    const context: any = {};

    it("should apply contains correctly", () => {
        const query = createBlankQuery();

        plugin.apply(query, {
            path: "name",
            value: "John",
            context
        });

        plugin.apply(query, {
            path: "name",
            value: "Doe",
            context
        });

        const expected: ElasticsearchBoolQueryConfig = {
            must_not: [],
            must: [
                {
                    query_string: {
                        allow_leading_wildcard: true,
                        default_operator: "and",
                        fields: ["name"],
                        query: "*John*"
                    }
                },
                {
                    query_string: {
                        allow_leading_wildcard: true,
                        default_operator: "and",
                        fields: ["name"],
                        query: "*Doe*"
                    }
                }
            ],
            filter: [],
            should: []
        };
        expect(query).toEqual(expected);
    });
});
