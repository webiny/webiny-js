import { createBlankQuery } from "../../helpers";
import { ElasticsearchBoolQueryConfig } from "~/types";
import { ElasticsearchQueryBuilderOperatorInPlugin } from "~/plugins/operator";

describe("ElasticsearchQueryBuilderOperatorInPlugin", () => {
    const plugin = new ElasticsearchQueryBuilderOperatorInPlugin();

    it("should apply must in correctly", () => {
        const query = createBlankQuery();

        plugin.apply(query, {
            path: "name.keyword",
            basePath: "name",
            value: ["John", "Johnny"],
            keyword: true
        });

        const expected: ElasticsearchBoolQueryConfig = {
            must_not: [],
            must: [
                {
                    terms: {
                        ["name.keyword"]: ["John", "Johnny"]
                    }
                }
            ],
            filter: [],
            should: []
        };
        expect(query).toEqual(expected);
    });
});
