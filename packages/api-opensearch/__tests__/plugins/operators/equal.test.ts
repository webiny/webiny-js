import { describe, expect, it } from "vitest";
import { createBlankQuery } from "../../helpers";
import { OpenSearchBoolQueryConfig } from "~/types.js";
import { Container } from "@webiny/di";
import { OpenSearchQueryBuilderOperatorFeature } from "~/features/OpenSearchQueryBuilderOperator/feature.js";
import { OpenSearchQueryBuilderOperatorRegistry } from "~/features/OpenSearchQueryBuilderOperator/abstractions/OpenSearchQueryBuilderOperatorRegistry.js";

describe("equal operator", () => {
    const container = new Container();
    OpenSearchQueryBuilderOperatorFeature.register(container);
    const registry = container.resolve(OpenSearchQueryBuilderOperatorRegistry);
    const operator = registry.get("eq")!;

    it("should apply equal correctly", () => {
        const query = createBlankQuery();

        operator.apply(query, {
            name: "name",
            basePath: "name",
            path: "name.keyword",
            value: "John",
            keyword: true
        });

        operator.apply(query, {
            name: "name",
            basePath: "name",
            path: "name.keyword",
            value: "Doe",
            keyword: true
        });

        const expected: OpenSearchBoolQueryConfig = {
            must_not: [],
            must: [],
            filter: [
                {
                    term: {
                        "name.keyword": "John"
                    }
                },
                {
                    term: {
                        "name.keyword": "Doe"
                    }
                }
            ],
            should: []
        };

        expect(query).toEqual(expected);
    });
});
