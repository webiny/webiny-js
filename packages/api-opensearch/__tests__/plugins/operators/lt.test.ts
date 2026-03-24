import { describe, expect, it } from "vitest";
import { createBlankQuery } from "../../helpers";
import { OpenSearchBoolQueryConfig } from "~/types.js";
import { OpenSearchQueryBuilderOperatorLesserThanPlugin } from "~/plugins/operator/index.js";

describe("OpenSearchQueryBuilderOperatorLesserThanPlugin", () => {
    const plugin = new OpenSearchQueryBuilderOperatorLesserThanPlugin();

    it("should apply lt correctly", () => {
        const query = createBlankQuery();
        plugin.apply(query, {
            name: "id",
            value: 100,
            path: "id",
            basePath: "id",
            keyword: false
        });

        const expected: OpenSearchBoolQueryConfig = {
            must_not: [],
            must: [],
            filter: [
                {
                    range: {
                        id: {
                            lt: 100
                        }
                    }
                }
            ],
            should: []
        };

        expect(query).toEqual(expected);
    });

    it("should apply multiple lt correctly", () => {
        const query = createBlankQuery();
        plugin.apply(query, {
            name: "id",
            value: 100,
            path: "id",
            basePath: "id",
            keyword: false
        });

        const to = new Date().toISOString();
        plugin.apply(query, {
            name: "id",
            value: to,
            path: "date",
            basePath: "date",
            keyword: false
        });

        const expected: OpenSearchBoolQueryConfig = {
            must_not: [],
            must: [],
            filter: [
                {
                    range: {
                        id: {
                            lt: 100
                        }
                    }
                },
                {
                    range: {
                        date: {
                            lt: to
                        }
                    }
                }
            ],
            should: []
        };
        expect(query).toEqual(expected);
    });
});
