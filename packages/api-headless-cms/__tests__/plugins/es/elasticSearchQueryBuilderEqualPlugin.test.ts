import { elasticSearchQueryBuilderEqualPlugin } from "../../../src/content/plugins/es/elasticSearchQueryBuilderEqualPlugin";
import { createBlankQuery } from "./helpers";
import { ElasticsearchQuery } from "../../../src/types";

describe("elasticSearchQueryBuilderEqualPlugin", () => {
    const plugin = elasticSearchQueryBuilderEqualPlugin();
    const context: any = {};

    it("should apply must correctly", () => {
        const query = createBlankQuery();

        plugin.apply(query, {
            field: "name",
            value: "John",
            context
        });

        plugin.apply(query, {
            field: "name",
            value: "Doe",
            context
        });

        const expected: ElasticsearchQuery = {
            mustNot: [],
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
            match: [],
            should: []
        };

        expect(query).toEqual(expected);
    });
});
