import { createBlankQuery } from "../../helpers";
import { ElasticsearchBoolQueryConfig } from "@webiny/api-plugin-elastic-search-client/types";
import { ElasticsearchQueryBuilderOperatorNotInPlugin } from "~/plugins/operator";

describe("ElasticsearchQueryBuilderOperatorNotInPlugin", () => {
    const plugin = new ElasticsearchQueryBuilderOperatorNotInPlugin();
    const context: any = {};

    it("should apply not in correctly", () => {
        const query = createBlankQuery();

        plugin.apply(query, {
            path: "name",
            value: ["John", "Doe", "P."],
            context
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
                path: "name",
                value: "somethingString",
                context
            });
        }).toThrow(`You cannot filter "name" with not_in and not send an array of values.`);
    });

    it("should throw an error when passing a object", () => {
        const query = createBlankQuery();

        expect(() => {
            plugin.apply(query, {
                path: "name",
                value: {
                    key: "value"
                },
                context
            });
        }).toThrow(`You cannot filter "name" with not_in and not send an array of values.`);
    });
});
