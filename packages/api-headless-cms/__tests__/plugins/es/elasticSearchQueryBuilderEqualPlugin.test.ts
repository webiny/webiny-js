import { elasticSearchQueryBuilderEqualPlugin } from "../../../src/content/plugins/es/elasticSearchQueryBuilderEqualPlugin";
import { createBlankQuery } from "./helpers";

describe("elasticSearchQueryBuilderEqualPlugin", () => {
    const plugin = elasticSearchQueryBuilderEqualPlugin();

    it("should apply must correctly", () => {
        const query = createBlankQuery();

        plugin.apply(query, {
            field: "name",
            value: "firstName"
        });

        plugin.apply(query, {
            field: "name",
            value: "lastName"
        });

        expect(query).toEqual({
            range: [],
            mustNot: [],
            must: [
                {
                    term: {
                        "name.keyword": "firstName"
                    }
                },
                {
                    term: {
                        "name.keyword": "lastName"
                    }
                }
            ],
            match: []
        });
    });
});
