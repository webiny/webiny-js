import { describe, expect, it } from "vitest";
import { createBlankQuery } from "../../helpers";
import { OpenSearchBoolQueryConfig } from "~/types";
import { OpenSearchQueryBuilderOperatorInPlugin } from "~/plugins/operator";

describe("OpenSearchQueryBuilderOperatorInPlugin", () => {
    const plugin = new OpenSearchQueryBuilderOperatorInPlugin();

    it(`should apply in operator`, () => {
        const query = createBlankQuery();

        plugin.apply(query, {
            name: "id",
            path: "name.keyword",
            basePath: "name",
            value: ["John", "Johnny"],
            keyword: true
        });

        const expected: OpenSearchBoolQueryConfig = {
            must_not: [],
            must: [],
            filter: [
                {
                    terms: {
                        ["name.keyword"]: ["John", "Johnny"]
                    }
                }
            ],
            should: []
        };
        expect(query).toEqual(expected);
    });
});
