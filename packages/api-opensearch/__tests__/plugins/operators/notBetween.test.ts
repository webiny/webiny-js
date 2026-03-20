import { describe, expect, it } from "vitest";
import { createBlankQuery } from "../../helpers";
import { OpenSearchBoolQueryConfig } from "~/types";
import { OpenSearchQueryBuilderOperatorNotBetweenPlugin } from "~/plugins/operator";

describe("OpenSearchQueryBuilderOperatorNotBetweenPlugin", () => {
    const plugin = new OpenSearchQueryBuilderOperatorNotBetweenPlugin();

    it("should apply not between range correctly", () => {
        const query = createBlankQuery();

        plugin.apply(query, {
            name: "id",
            path: "id",
            basePath: "id",
            value: [100, 200],
            keyword: false
        });

        const expected: OpenSearchBoolQueryConfig = {
            must_not: [
                {
                    range: {
                        id: {
                            lte: 200,
                            gte: 100
                        }
                    }
                }
            ],
            must: [],
            filter: [],
            should: []
        };
        expect(query).toEqual(expected);
    });
});
