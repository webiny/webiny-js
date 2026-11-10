import { startsWithQuery } from "~/features/OpenSearchQueryBuilderOperator/operators/startsWithQuery.js";
import { describe, expect, it } from "vitest";
import { createBlankQuery } from "~/testing/index.js";
import { OpenSearchBoolQueryConfig } from "~/types.js";
import { Container } from "@webiny/di";
import { OpenSearchQueryBuilderOperatorFeature } from "~/features/OpenSearchQueryBuilderOperator/feature.js";
import { OpenSearchQueryBuilderOperatorRegistry } from "~/features/OpenSearchQueryBuilderOperator/abstractions/OpenSearchQueryBuilderOperatorRegistry.js";

describe("startsWith operator", () => {
    const container = new Container();
    OpenSearchQueryBuilderOperatorFeature.register(container);
    const registry = container.resolve(OpenSearchQueryBuilderOperatorRegistry);
    const operator = registry.get("startsWith")!;

    it("should apply startsWith correctly", () => {
        const query = createBlankQuery();

        operator.apply(query, {
            name: "name",
            path: "name.keyword",
            basePath: "name",
            value: "John",
            keyword: true
        });

        operator.apply(query, {
            name: "name",
            path: "name.keyword",
            basePath: "name",
            value: "Doe",
            keyword: true
        });

        const expected: OpenSearchBoolQueryConfig = {
            must_not: [],
            must: [],
            filter: [startsWithQuery("name", "John"), startsWithQuery("name", "Doe")],
            should: []
        };
        expect(query).toEqual(expected);
    });

    it("should match a prefix of the whole value, with a fallback for long values", () => {
        expect(startsWithQuery("name", "John")).toEqual({
            bool: {
                should: [
                    { prefix: { "name.keyword": { value: "John", case_insensitive: true } } },
                    {
                        bool: {
                            must: [{ match_phrase_prefix: { name: "John" } }],
                            must_not: [{ exists: { field: "name.keyword" } }]
                        }
                    }
                ],
                minimum_should_match: 1
            }
        });
    });
});
