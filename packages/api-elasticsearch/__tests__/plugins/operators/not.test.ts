import { createBlankQuery } from "../../helpers";
import { ElasticsearchBoolQueryConfig } from "~/types";
import { ElasticsearchQueryBuilderOperatorNotPlugin } from "~/plugins/operator";

describe("ElasticsearchQueryBuilderOperatorNotPlugin", () => {
    const plugin = new ElasticsearchQueryBuilderOperatorNotPlugin();

    const context: any = {};

    it("should apply not correctly", () => {
        const query = createBlankQuery();

        plugin.apply(query, {
            path: "name",
            value: "John",
            context
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
