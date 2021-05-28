import { elasticsearchOperatorLtePlugin } from "../../../../src/elasticsearch/operators/lte";
import { createBlankQuery } from "../helpers";
import { ElasticsearchQuery } from "@webiny/api-plugin-elastic-search-client/types";

describe("elasticsearchOperatorLtePlugin", () => {
    const plugin = elasticsearchOperatorLtePlugin();
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

            should: []
        };
        expect(query).toEqual(expected);
    });
});
