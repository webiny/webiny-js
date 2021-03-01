import { elasticSearchQueryBuilderLtePlugin } from "../../../src/content/plugins/es/elasticSearchQueryBuilderLtePlugin";
import { createBlankQuery } from "./helpers";
import { ElasticsearchQuery } from "../../../src/types";

describe("elasticSearchQueryBuilderLtePlugin", () => {
    const plugin = elasticSearchQueryBuilderLtePlugin();
    const context: any = {};

    it("should apply lte correctly", () => {
        const query = createBlankQuery();
        plugin.apply(query, {
            value: 100,
            field: "id",
            context
        });

        const expected: ElasticsearchQuery = {
            mustNot: [],
            must: [
                {
                    range: {
                        id: {
                            lte: 100
                        }
                    }
                }
            ],
            match: [],
            should: []
        };

        expect(query).toEqual(expected);
    });

    it("should apply multiple lte correctly", () => {
        const query = createBlankQuery();
        plugin.apply(query, {
            value: 100,
            field: "id",
            context
        });

        const to = new Date();
        plugin.apply(query, {
            value: to,
            field: "date",
            context
        });

        const expected: ElasticsearchQuery = {
            mustNot: [],
            must: [
                {
                    range: {
                        id: {
                            lte: 100
                        }
                    }
                },
                {
                    range: {
                        date: {
                            lte: to
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
