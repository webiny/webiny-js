import { describe, expect, it } from "vitest";
import { createBlankQuery } from "../../helpers";
import { OpenSearchBoolQueryConfig } from "~/types";
import { OpenSearchQueryBuilderOperatorGreaterThanPlugin } from "~/plugins/operator";

describe("OpenSearchQueryBuilderOperatorGreaterThanPlugin", () => {
    const plugin = new OpenSearchQueryBuilderOperatorGreaterThanPlugin();

    it("should apply gt correctly", () => {
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
                            gt: 100
                        }
                    }
                }
            ],
            should: []
        };

        expect(query).toEqual(expected);
    });

    it("should apply multiple gt correctly", () => {
        const query = createBlankQuery();
        plugin.apply(query, {
            name: "id",
            value: 100,
            path: "id",
            basePath: "id",
            keyword: false
        });

        const from = new Date().toISOString();
        plugin.apply(query, {
            name: "id",
            value: from,
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
                            gt: 100
                        }
                    }
                },
                {
                    range: {
                        date: {
                            gt: from
                        }
                    }
                }
            ],
            should: []
        };
        expect(query).toEqual(expected);
    });
});
