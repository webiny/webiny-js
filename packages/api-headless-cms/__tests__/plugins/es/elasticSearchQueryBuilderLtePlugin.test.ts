import { elasticSearchQueryBuilderLtePlugin } from "../../../src/content/plugins/es/elasticSearchQueryBuilderLtePlugin";
import { createBlankQuery } from "./helpers";
import { ElasticSearchQueryType } from "@webiny/api-headless-cms/types";

describe("elasticSearchQueryBuilderLtePlugin", () => {
    const plugin = elasticSearchQueryBuilderLtePlugin();

    it("should apply lte correctly", () => {
        const query = createBlankQuery();
        plugin.apply(query, {
            value: 100,
            field: "id"
        });

        const expected: ElasticSearchQueryType = {
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
            field: "id"
        });

        const to = new Date();
        plugin.apply(query, {
            value: to,
            field: "date"
        });

        const expected: ElasticSearchQueryType = {
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
