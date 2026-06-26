import { describe, expect, it } from "vitest";
import { createBlankQuery } from "~/testing/index.js";
import { OpenSearchBoolQueryConfig } from "~/types.js";
import { Container } from "@webiny/di";
import { OpenSearchQueryBuilderOperatorFeature } from "~/features/OpenSearchQueryBuilderOperator/feature.js";
import { OpenSearchQueryBuilderOperatorRegistry } from "~/features/OpenSearchQueryBuilderOperator/abstractions/OpenSearchQueryBuilderOperatorRegistry.js";

describe("between operator", () => {
    const container = new Container();
    OpenSearchQueryBuilderOperatorFeature.register(container);
    const registry = container.resolve(OpenSearchQueryBuilderOperatorRegistry);
    const operator = registry.get("between")!;

    it("should apply between correctly", () => {
        const query = createBlankQuery();
        operator.apply(query, {
            name: "id",
            value: [100, 110],
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
                            lte: 110,
                            gte: 100
                        }
                    }
                }
            ],
            should: []
        };

        expect(query).toEqual(expected);
    });

    it("should apply multiple between correctly", () => {
        const query = createBlankQuery();
        operator.apply(query, {
            name: "id",
            value: [100, 110],
            path: "id",
            basePath: "id",
            keyword: false
        });

        const from = new Date();
        const to = new Date();
        to.setTime(from.getTime() + 1000000);
        operator.apply(query, {
            name: "id",
            value: [from.toISOString(), to.toISOString()],
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
                            lte: 110,
                            gte: 100
                        }
                    }
                },
                {
                    range: {
                        date: {
                            lte: to.toISOString(),
                            gte: from.toISOString()
                        }
                    }
                }
            ],
            should: []
        };
        expect(query).toEqual(expected);
    });

    it("should throw an error when array not sent", () => {
        const query = createBlankQuery();

        expect(() => {
            operator.apply(query, {
                name: "id",
                value: "notAnArray",
                path: "id",
                basePath: "id",
                keyword: false
            });
        }).toThrow(
            `You cannot filter field path "id" with between query and not send an array of values.`
        );
    });

    const values = [[[1, 2, 3]], [[1]]];

    it.each(values)(
        "should throw an error when passing array with more or less than two values",
        (value: number[]) => {
            const query = createBlankQuery();

            expect(() => {
                operator.apply(query, {
                    name: "id",
                    value,
                    path: "id",
                    basePath: "id",
                    keyword: false
                });
            }).toThrow(`You must pass 2 values in the array for field path "id" filtering.`);
        }
    );
});
