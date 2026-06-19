import { describe, expect, it } from "vitest";
import { createBlankQuery } from "../../helpers";
import { OpenSearchBoolQueryConfig } from "~/types.js";
import { Container } from "@webiny/di";
import { OpenSearchQueryBuilderOperatorFeature } from "~/features/OpenSearchQueryBuilderOperator/feature.js";
import { OpenSearchQueryBuilderOperatorRegistry } from "~/features/OpenSearchQueryBuilderOperator/abstractions/OpenSearchQueryBuilderOperatorRegistry.js";

describe("not_in operator", () => {
    const container = new Container();
    OpenSearchQueryBuilderOperatorFeature.register(container);
    const registry = container.resolve(OpenSearchQueryBuilderOperatorRegistry);
    const operator = registry.get("not_in")!;

    it("should apply not in correctly", () => {
        const query = createBlankQuery();

        operator.apply(query, {
            name: "name",
            basePath: "name",
            path: "name.keyword",
            value: ["John", "Doe", "P."],
            keyword: true
        });
        const expected: OpenSearchBoolQueryConfig = {
            must_not: [
                {
                    terms: {
                        "name.keyword": ["John", "Doe", "P."]
                    }
                }
            ],
            must: [],
            filter: [],
            should: []
        };
        expect(query).toEqual(expected);
    });

    it("should throw an error when passing a string", () => {
        const query = createBlankQuery();

        expect(() => {
            operator.apply(query, {
                name: "name",
                basePath: "name",
                path: "name.keyword",
                value: "somethingString",
                keyword: true
            });
        }).toThrow(
            `You cannot filter field "name" with "not_in" operator and not send an array of values.`
        );
    });

    it("should throw an error when passing a object", () => {
        const query = createBlankQuery();

        expect(() => {
            operator.apply(query, {
                name: "name",
                basePath: "name",
                path: "name.keyword",
                value: {
                    key: "value"
                },
                keyword: true
            });
        }).toThrow(
            `You cannot filter field "name" with "not_in" operator and not send an array of values.`
        );
    });
});
