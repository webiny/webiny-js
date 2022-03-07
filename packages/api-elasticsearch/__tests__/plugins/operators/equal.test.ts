import { createBlankQuery } from "../../helpers";
import { ElasticsearchBoolQueryConfig } from "~/types";
import { ElasticsearchQueryBuilderOperatorEqualPlugin } from "~/plugins/operator";

describe("ElasticsearchQueryBuilderOperatorEqualPlugin", () => {
    const plugin = new ElasticsearchQueryBuilderOperatorEqualPlugin();

    it("should apply must correctly", () => {
        const query = createBlankQuery();

        plugin.apply(query, {
            basePath: "name",
            path: "name.keyword",
            value: "John",
            keyword: true
        });

        plugin.apply(query, {
            basePath: "name",
            path: "name.keyword",
            value: "Doe",
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
