import { elasticsearchOperatorNotInPlugin } from "../../../../src/elasticsearch/operators/notIn";
import { createBlankQuery } from "../helpers";
import { ElasticsearchQuery } from "@webiny/api-plugin-elastic-search-client/types";

describe("elasticsearchOperatorNotInPlugin", () => {
    const plugin = elasticsearchOperatorNotInPlugin();
    const context: any = {};

    it("should apply not in correctly", () => {
        const query = createBlankQuery();

        plugin.apply(query, {
            field: "name",
            value: ["John", "Doe", "P."],
            context
        });
        const expected: ElasticsearchQuery = {
            mustNot: [
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
                field: "name",
                value: "somethingString",
                context
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
                },
                context
            });
        }).toThrow(`You cannot filter "name" with not_in and not send an array of values.`);
    });
});
