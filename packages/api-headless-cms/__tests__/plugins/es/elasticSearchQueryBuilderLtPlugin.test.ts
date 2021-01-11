import { elasticSearchQueryBuilderLtPlugin } from "../../../src/content/plugins/es/elasticSearchQueryBuilderLtPlugin";
import { createBlankQuery } from "./helpers";
import { ElasticsearchQuery } from "@webiny/api-headless-cms/types";

describe("elasticSearchQueryBuilderLtPlugin", () => {
    const plugin = elasticSearchQueryBuilderLtPlugin();

    it("should apply lt correctly", () => {
        const query = createBlankQuery();
        plugin.apply(query, {
            value: 100,
            field: "id"
        });

        const expected: ElasticsearchQuery = {
            mustNot: [],
            must: [
                {
                    range: {
                        id: {
                            lt: 100
                        }
                    }
                }
            ],
            match: [],
            should: []
        };

        expect(query).toEqual(expected);
    });

    it("should apply multiple lt correctly", () => {
        const query = createBlankQuery();
        plugin.apply(query, {
            value: 100,
            field: "id"
        });

        const to = new Date();
        plugin.apply(query, {
            value: to,
            field: "date"
        });

        const expected: ElasticsearchQuery = {
            mustNot: [],
            must: [
                {
                    range: {
                        id: {
                            lt: 100
                        }
                    }
                },
                {
                    range: {
                        date: {
                            lt: to
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
