import { createBlankQuery } from "../../helpers";
import { ElasticsearchBoolQueryConfig } from "~/types";
import { ElasticsearchQueryBuilderOperatorNotInPlugin } from "~/plugins/operator";

describe("ElasticsearchQueryBuilderOperatorNotInPlugin", () => {
    const plugin = new ElasticsearchQueryBuilderOperatorNotInPlugin();

    it("should apply not in correctly", () => {
        const query = createBlankQuery();

        plugin.apply(query, {
            name: "name",
            basePath: "name",
            path: "name.keyword",
            value: ["John", "Doe", "P."],
            keyword: true
        });
        const expected: ElasticsearchBoolQueryConfig = {
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
