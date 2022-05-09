import { createBlankQuery } from "../../helpers";
import { ElasticsearchBoolQueryConfig } from "~/types";
import { ElasticsearchQueryBuilderOperatorNotStartsWithPlugin } from "~/plugins/operator";

describe("ElasticsearchQueryBuilderOperatorNotStartsWithPlugin", () => {
    const plugin = new ElasticsearchQueryBuilderOperatorNotStartsWithPlugin();

    it("should apply startsWith correctly", () => {
        const query = createBlankQuery();

        plugin.apply(query, {
            path: "name.keyword",
            basePath: "name",
            value: "John",
            keyword: true
        });

        plugin.apply(query, {
            path: "name.keyword",
            basePath: "name",
            value: "Doe",
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
