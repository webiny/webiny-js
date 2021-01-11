import { elasticSearchQueryBuilderContainsPlugin } from "../../../src/content/plugins/es/elasticSearchQueryBuilderContainsPlugin";
import { createBlankQuery } from "./helpers";
import { ElasticSearchQuery } from "@webiny/api-headless-cms/types";

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

        const expected: ElasticSearchQuery = {
            mustNot: [],
            must: [
                {
                    // eslint-disable-next-line @typescript-eslint/camelcase
                    query_string: {
                        // eslint-disable-next-line @typescript-eslint/camelcase
                        allow_leading_wildcard: true,
                        fields: ["name"],
                        query: "*John*"
                    }
                },
                {
                    // eslint-disable-next-line @typescript-eslint/camelcase
                    query_string: {
                        // eslint-disable-next-line @typescript-eslint/camelcase
                        allow_leading_wildcard: true,
                        fields: ["name"],
                        query: "*Doe*"
                    }
                }
            ],
            match: [],
            should: []
        };
        expect(query).toEqual(expected);
    });
});
