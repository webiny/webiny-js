import { elasticSearchQueryBuilderGtePlugin } from "../../../src/content/plugins/es/elasticSearchQueryBuilderGtePlugin";
import { createBlankQuery } from "./helpers";
import { ElasticSearchQuery } from "@webiny/api-headless-cms/types";

describe("elasticSearchQueryBuilderGtePlugin", () => {
    const plugin = elasticSearchQueryBuilderGtePlugin();

    it("should apply gte correctly", () => {
        const query = createBlankQuery();
        plugin.apply(query, {
            value: 100,
            field: "id"
        });

        const expected: ElasticSearchQuery = {
            mustNot: [],
            must: [
                {
                    range: {
                        id: {
                            gte: 100
                        }
                    }
                }
            ],
            match: [],
            should: []
        };

        expect(query).toEqual(expected);
    });

    it("should apply multiple gte correctly", () => {
        const query = createBlankQuery();
        plugin.apply(query, {
            value: 100,
            field: "id"
        });

        const from = new Date();
        plugin.apply(query, {
            value: from,
            field: "date"
        });

        const expected: ElasticSearchQuery = {
            mustNot: [],
            must: [
                {
                    range: {
                        id: {
                            gte: 100
                        }
                    }
                },
                {
                    range: {
                        date: {
                            gte: from
                        }
                    }
                }
            ],
            match: [],
            should: []
        };
        expect(query).toEqual(expected);
    });
});
