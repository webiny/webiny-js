import { describe, expect, it } from "vitest";
import { createBlankQuery } from "~/testing/index.js";
import { OpenSearchBoolQueryConfig } from "~/types.js";
import { Container } from "@webiny/di";
import { OpenSearchQueryBuilderOperatorFeature } from "~/features/OpenSearchQueryBuilderOperator/feature.js";
import { OpenSearchQueryBuilderOperatorRegistry } from "~/features/OpenSearchQueryBuilderOperator/abstractions/OpenSearchQueryBuilderOperatorRegistry.js";

describe("lt operator", () => {
    const container = new Container();
    OpenSearchQueryBuilderOperatorFeature.register(container);
    const registry = container.resolve(OpenSearchQueryBuilderOperatorRegistry);
    const operator = registry.get("lt")!;

    it("should apply lt correctly", () => {
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
