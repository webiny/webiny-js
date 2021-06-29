import { createBlankQuery } from "../../helpers";
import { ElasticsearchBoolQueryConfig } from "~/types";
import { ElasticsearchQueryBuilderOperatorEqualPlugin } from "~/plugins/operator";

describe("ElasticsearchQueryBuilderOperatorEqualPlugin", () => {
    const plugin = new ElasticsearchQueryBuilderOperatorEqualPlugin();
    const context: any = {};

    it("should apply must correctly", () => {
        const query = createBlankQuery();

        plugin.apply(query, {
            basePath: "name",
            path: "name.keyword",
            value: "John",
            context,
            keyword: true
        });

        plugin.apply(query, {
            basePath: "name",
            path: "name.keyword",
            value: "Doe",
            context,
            keyword: true
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
