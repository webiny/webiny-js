import { describe, expect, it } from "vitest";
import { createBlankQuery } from "../../helpers";
import { OpenSearchBoolQueryConfig } from "~/types.js";
import { OpenSearchQueryBuilderOperatorEqualPlugin } from "~/plugins/operator/index.js";

describe("OpenSearchQueryBuilderOperatorEqualPlugin", () => {
    const plugin = new OpenSearchQueryBuilderOperatorEqualPlugin();

    it("should apply equal correctly", () => {
        const query = createBlankQuery();

        plugin.apply(query, {
            name: "name",
            basePath: "name",
            path: "name.keyword",
            value: "John",
            keyword: true
        });

        plugin.apply(query, {
            name: "name",
            basePath: "name",
            path: "name.keyword",
            value: "Doe",
            keyword: true
        });

        const expected: OpenSearchBoolQueryConfig = {
            must_not: [],
            must: [],
            filter: [
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
            should: []
        };

        expect(query).toEqual(expected);
    });
});
