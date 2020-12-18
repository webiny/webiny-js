import { elasticSearchQueryBuilderNotContainsPlugin } from "../../../src/content/plugins/es/elasticSearchQueryBuilderNotContainsPlugin";
import { createBlankQuery } from "./helpers";

describe("elasticSearchQueryBuilderNotContainsPlugin", () => {
    const plugin = elasticSearchQueryBuilderNotContainsPlugin();

    it("should apply not contains correctly", () => {
        const query = createBlankQuery();

        plugin.apply(query, {
            field: "name",
            value: "firstName"
        });
        expect(query).toEqual({
            range: [],
            mustNot: [
                {
                    term: {
                        "name.keyword": "firstName"
                    }
                }
            ],
            must: [],
            match: []
        });
    });
});
