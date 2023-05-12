import { createBlankQuery } from "../../helpers";
import { ElasticsearchBoolQueryConfig } from "~/types";
import { ElasticsearchQueryBuilderOperatorInPlugin } from "~/plugins/operator";

describe("ElasticsearchQueryBuilderOperatorInPlugin", () => {
    const plugin = new ElasticsearchQueryBuilderOperatorInPlugin();

    it(`should apply in operator`, () => {
        const query = createBlankQuery();

        plugin.apply(query, {
            name: "id",
            path: "name.keyword",
            basePath: "name",
            value: ["John", "Johnny"],
            keyword: true
        });

        const expected: ElasticsearchBoolQueryConfig = {
            must_not: [],
            must: [],
            filter: [
                {
                    terms: {
                        ["name.keyword"]: ["John", "Johnny"]
                    }
                }
            ],
            should: []
        };
        expect(query).toEqual(expected);
    });
});
