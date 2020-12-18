import { elasticSearchQueryBuilderInPlugin } from "../../../src/content/plugins/es/elasticSearchQueryBuilderInPlugin";
import { createBlankQuery } from "./helpers";

describe("elasticSearchQueryBuilderInPlugin", () => {
    const plugin = elasticSearchQueryBuilderInPlugin();

    it("should apply must in correctly", () => {
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
