import { elasticSearchQueryBuilderInPlugin } from "../../../src/content/plugins/es/elasticSearchQueryBuilderInPlugin";
import { createBlankQuery } from "./helpers";
import { ElasticSearchQueryType } from "@webiny/api-headless-cms/types";

describe("elasticSearchQueryBuilderInPlugin", () => {
    const plugin = elasticSearchQueryBuilderInPlugin();

    it("should apply must in correctly", () => {
        const query = createBlankQuery();

        plugin.apply(query, {
            field: "name",
            value: ["John", "Johnny"]
        });

        const expected: ElasticSearchQueryType = {
            mustNot: [],
            must: [],
            match: [],
            should: [
                {
                    term: {
                        name: "John"
                    }
                },
                {
                    term: {
                        name: "Johnny"
                    }
                }
            ]
        };
        expect(query).toEqual(expected);
    });
});
