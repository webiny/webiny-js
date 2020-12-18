import { elasticSearchQueryBuilderNotPlugin } from "../../../src/content/plugins/es/elasticSearchQueryBuilderNotPlugin";
import { createBlankQuery } from "./helpers";

describe("elasticSearchQueryBuilderNotPlugin", () => {
    const plugin = elasticSearchQueryBuilderNotPlugin();

    it("should apply not correctly", () => {
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
