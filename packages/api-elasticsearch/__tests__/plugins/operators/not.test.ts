import { createBlankQuery } from "../../helpers";
import { ElasticsearchBoolQueryConfig } from "~/types";
import { ElasticsearchQueryBuilderOperatorNotPlugin } from "~/plugins/operator";

describe("ElasticsearchQueryBuilderOperatorNotPlugin", () => {
    const plugin = new ElasticsearchQueryBuilderOperatorNotPlugin();

    it("should apply not correctly", () => {
        const query = createBlankQuery();

        plugin.apply(query, {
            name: "name",
            path: "name.keyword",
            basePath: "name",
            value: "John",
            keyword: true
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
