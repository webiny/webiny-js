import { describe, expect, it } from "vitest";
import { createBlankQuery } from "../../helpers";
import { OpenSearchBoolQueryConfig } from "~/types";
import { OpenSearchQueryBuilderOperatorLesserThanOrEqualToPlugin } from "~/plugins/operator";

describe("OpenSearchQueryBuilderOperatorLesserThanOrEqualToPlugin", () => {
    const plugin = new OpenSearchQueryBuilderOperatorLesserThanOrEqualToPlugin();

    it("should apply lte correctly", () => {
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
                            lte: 100
                        }
                    }
                }
            ],
            should: []
        };

        expect(query).toEqual(expected);
    });

    it("should apply multiple lte correctly", () => {
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
                            lte: 100
                        }
                    }
                },
                {
                    range: {
                        date: {
                            lte: to
                        }
                    }
                }
            ],
            should: []
        };
        expect(query).toEqual(expected);
    });
});
