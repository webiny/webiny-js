import { describe, expect, it } from "vitest";
import { createBlankQuery } from "../../helpers";
import { OpenSearchBoolQueryConfig } from "~/types.js";
import { OpenSearchQueryBuilderOperatorNotStartsWithPlugin } from "~/plugins/operator/index.js";

describe("OpenSearchQueryBuilderOperatorNotStartsWithPlugin", () => {
    const plugin = new OpenSearchQueryBuilderOperatorNotStartsWithPlugin();

    it("should apply startsWith correctly", () => {
        const query = createBlankQuery();

        plugin.apply(query, {
            name: "name",
            path: "name.keyword",
            basePath: "name",
            value: "John",
            keyword: true
        });

        plugin.apply(query, {
            name: "name",
            path: "name.keyword",
            basePath: "name",
            value: "Doe",
            keyword: true
        });

        const expected: OpenSearchBoolQueryConfig = {
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
