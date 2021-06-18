import { createBlankQuery } from "../../helpers";
import { ElasticsearchBoolQueryConfig } from "~/types";
import { ElasticsearchQueryBuilderOperatorNotInPlugin } from "~/plugins/operator";

describe("ElasticsearchQueryBuilderOperatorNotInPlugin", () => {
    const plugin = new ElasticsearchQueryBuilderOperatorNotInPlugin();
    const context: any = {};

    it("should apply not in correctly", () => {
        const query = createBlankQuery();

        plugin.apply(query, {
            basePath: "name",
            path: "name.keyword",
            value: ["John", "Doe", "P."],
            context,
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
                basePath: "name",
                path: "name.keyword",
                value: "somethingString",
                context,
                keyword: true
            });
        }).toThrow(
            `You cannot filter field path "name" with not_in and not send an array of values.`
        );
    });

    it("should throw an error when passing a object", () => {
        const query = createBlankQuery();

        expect(() => {
            plugin.apply(query, {
                basePath: "name",
                path: "name.keyword",
                value: {
                    key: "value"
                },
                context,
                keyword: true
            });
        }).toThrow(
            `You cannot filter field path "name" with not_in and not send an array of values.`
        );
    });
});
