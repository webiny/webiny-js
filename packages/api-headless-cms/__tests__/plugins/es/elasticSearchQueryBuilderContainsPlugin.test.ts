import { elasticSearchQueryBuilderContainsPlugin } from "../../../src/content/plugins/es/elasticSearchQueryBuilderContainsPlugin";
import { createBlankQuery } from "./helpers";
import { ElasticSearchQueryType } from "@webiny/api-headless-cms/types";

describe("elasticSearchQueryBuilderContainsPlugin", () => {
    const plugin = elasticSearchQueryBuilderContainsPlugin();

    it("should apply contains correctly", () => {
        const query = createBlankQuery();

        plugin.apply(query, {
            field: "name",
            value: "John"
        });

        plugin.apply(query, {
            field: "name",
            value: "Doe"
        });

        const expected: ElasticSearchQueryType = {
            mustNot: [],
            must: [
                {
                    // eslint-disable-next-line @typescript-eslint/camelcase
                    simple_query_string: {
                        fields: ["name"],
                        query: "John"
                    }
                },
                {
                    // eslint-disable-next-line @typescript-eslint/camelcase
                    simple_query_string: {
                        fields: ["name"],
                        query: "Doe"
                    }
                }
            ],
            match: [],
            should: []
        };
        expect(query).toEqual(expected);
    });
});
