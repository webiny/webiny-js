import { describe, expect, it } from "vitest";
import { createBlankQuery } from "~/testing/index.js";
import { OpenSearchBoolQueryConfig } from "~/types.js";
import { Container } from "@webiny/di";
import { OpenSearchQueryBuilderOperatorFeature } from "~/features/OpenSearchQueryBuilderOperator/feature.js";
import { OpenSearchQueryBuilderOperatorRegistry } from "~/features/OpenSearchQueryBuilderOperator/abstractions/OpenSearchQueryBuilderOperatorRegistry.js";

describe("lte operator", () => {
    const container = new Container();
    OpenSearchQueryBuilderOperatorFeature.register(container);
    const registry = container.resolve(OpenSearchQueryBuilderOperatorRegistry);
    const operator = registry.get("lte")!;

    it("should apply lte correctly", () => {
        const query = createBlankQuery();
        operator.apply(query, {
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
        operator.apply(query, {
            name: "id",
            value: 100,
            path: "id",
            basePath: "id",
            keyword: false
        });

        const to = new Date().toISOString();
        operator.apply(query, {
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
