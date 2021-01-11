import { elasticSearchQueryBuilderInPlugin } from "../../../src/content/plugins/es/elasticSearchQueryBuilderInPlugin";
import { createBlankQuery } from "./helpers";
import { ElasticsearchQuery } from "@webiny/api-headless-cms/types";

describe("elasticSearchQueryBuilderInPlugin", () => {
    const plugin = elasticSearchQueryBuilderInPlugin();

    it("should apply must in correctly", () => {
        const query = createBlankQuery();

        plugin.apply(query, {
            field: "name",
            value: ["John", "Johnny"]
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
            match: [],
            should: []
        };
        expect(query).toEqual(expected);
    });
});
