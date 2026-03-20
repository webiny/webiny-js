import { describe, expect, it } from "vitest";
import { createBlankQuery } from "../../helpers";
import { OpenSearchBoolQueryConfig } from "~/types";
import { OpenSearchQueryBuilderOperatorStartsWithPlugin } from "~/plugins/operator";

describe("OpenSearchQueryBuilderOperatorStartsWithPlugin", () => {
    const plugin = new OpenSearchQueryBuilderOperatorStartsWithPlugin();

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
            must_not: [],
            must: [],
            filter: [
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
            should: []
        };
        expect(query).toEqual(expected);
    });
});
