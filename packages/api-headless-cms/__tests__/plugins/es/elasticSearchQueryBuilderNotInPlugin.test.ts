import { elasticSearchQueryBuilderNotInPlugin } from "../../../src/content/plugins/es/elasticSearchQueryBuilderNotInPlugin";
import { createBlankQuery } from "./helpers";
import { ElasticSearchQueryType } from "@webiny/api-headless-cms/types";

describe("elasticSearchQueryBuilderNotInPlugin", () => {
    const plugin = elasticSearchQueryBuilderNotInPlugin();

    it("should apply not in correctly", () => {
        const query = createBlankQuery();

        plugin.apply(query, {
            field: "name",
            value: ["John", "Doe", "P."]
        });
        const expected: ElasticSearchQueryType = {
            mustNot: [
                {
                    term: {
                        "name.keyword": "John"
                    }
                },
                {
                    term: {
                        "name.keyword": "Doe"
                    }
                },
                {
                    term: {
                        "name.keyword": "P."
                    }
                }
            ],
            must: [],
            match: [],
            should: []
        };
        expect(query).toEqual(expected);
    });

    it("should throw an error when passing a string", () => {
        const query = createBlankQuery();

        expect(() => {
            plugin.apply(query, {
                field: "name",
                value: "somethingString"
            });
        }).toThrow(`You cannot filter "name" with not_in and not send an array of values.`);
    });

    it("should throw an error when passing a object", () => {
        const query = createBlankQuery();

        expect(() => {
            plugin.apply(query, {
                field: "name",
                value: {
                    key: "value"
                }
            });
        }).toThrow(`You cannot filter "name" with not_in and not send an array of values.`);
    });
});
