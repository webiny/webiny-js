import { createBlankQuery } from "../../helpers";
import { ElasticsearchBoolQueryConfig } from "@webiny/api-plugin-elastic-search-client/types";
import { ElasticsearchQueryBuilderOperatorEqualPlugin } from "~/plugins/operator";

describe("ElasticsearchQueryBuilderOperatorEqualPlugin", () => {
    const plugin = new ElasticsearchQueryBuilderOperatorEqualPlugin();
    const context: any = {};

    it("should apply must correctly", () => {
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
            filter: [],
            should: []
        };

        expect(query).toEqual(expected);
    });
});
