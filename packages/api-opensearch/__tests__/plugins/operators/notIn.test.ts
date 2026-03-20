import { describe, expect, it } from "vitest";
import { createBlankQuery } from "../../helpers";
import { OpenSearchBoolQueryConfig } from "~/types";
import { OpenSearchQueryBuilderOperatorNotInPlugin } from "~/plugins/operator";

describe("OpenSearchQueryBuilderOperatorNotInPlugin", () => {
    const plugin = new OpenSearchQueryBuilderOperatorNotInPlugin();

    it("should apply not in correctly", () => {
        const query = createBlankQuery();

        plugin.apply(query, {
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
            plugin.apply(query, {
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
            plugin.apply(query, {
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
