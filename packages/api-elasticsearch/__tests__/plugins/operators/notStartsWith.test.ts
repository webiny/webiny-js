import { createBlankQuery } from "../../helpers";
import { ElasticsearchBoolQueryConfig } from "~/types";
import { ElasticsearchQueryBuilderOperatorNotStartsWithPlugin } from "~/plugins/operator";

describe("ElasticsearchQueryBuilderOperatorNotStartsWithPlugin", () => {
    const plugin = new ElasticsearchQueryBuilderOperatorNotStartsWithPlugin();
    const context: any = {};

    it("should apply startsWith correctly", () => {
        const query = createBlankQuery();

        plugin.apply(query, {
            path: "name.keyword",
            basePath: "name",
            value: "John",
            context,
            keyword: true
        });

        plugin.apply(query, {
            path: "name.keyword",
            basePath: "name",
            value: "Doe",
            context,
            keyword: true
        });

        const expected: ElasticsearchBoolQueryConfig = {
            must: [],
            must_not: [
                {
                    match_phrase_prefix: {
                        name: "John"
                    }
                },
                {
                    match_phrase_prefix: {
                        name: "Doe"
                    }
                }
            ],
            filter: [],
            should: []
        };
        expect(query).toEqual(expected);
    });
});
