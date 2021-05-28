import { elasticsearchOperatorInPlugin } from "../../../../src/elasticsearch/operators/in";
import { createBlankQuery } from "../helpers";
import { ElasticsearchQuery } from "@webiny/api-plugin-elastic-search-client/types";

describe("elasticsearchOperatorInPlugin", () => {
    const plugin = elasticsearchOperatorInPlugin();
    const context: any = {};

    it("should apply must in correctly", () => {
        const query = createBlankQuery();

        plugin.apply(query, {
            field: "name",
            value: ["John", "Johnny"],
            context
        });

        const expected: ElasticsearchQuery = {
            mustNot: [],
            must: [
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
