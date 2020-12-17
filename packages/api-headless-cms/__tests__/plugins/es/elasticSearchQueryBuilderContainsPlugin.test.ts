import { elasticSearchQueryBuilderContainsPlugin } from "../../../src/content/plugins/es/elasticSearchQueryBuilderContainsPlugin";
import { createBlankQuery } from "./helpers";

describe("elasticSearchQueryBuilderContainsPlugin", () => {
    const plugin = elasticSearchQueryBuilderContainsPlugin();

    it("should apply match correctly", () => {
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
            must: [],
            match: [
                {
                    name: {
                        query: "firstName",
                        operator: "AND"
                    }
                },
                {
                    name: {
                        query: "lastName",
                        operator: "AND"
                    }
                }
            ]
        });
    });
});
