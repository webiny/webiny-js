import { elasticSearchQueryBuilderNotInPlugin } from "../../../src/content/plugins/es/elasticSearchQueryBuilderNotInPlugin";
import { createBlankQuery } from "./helpers";

describe("elasticSearchQueryBuilderNotInPlugin", () => {
    const plugin = elasticSearchQueryBuilderNotInPlugin();

    it("should apply not in correctly", () => {
        const query = createBlankQuery();

        plugin.apply(query, {
            field: "name",
            value: ["firstName", "lastName", "middleName"]
        });
        expect(query).toEqual({
            range: [],
            mustNot: [
                {
                    term: {
                        "name.keyword": ["firstName", "lastName", "middleName"]
                    }
                }
            ],
            must: [],
            match: []
        });
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
