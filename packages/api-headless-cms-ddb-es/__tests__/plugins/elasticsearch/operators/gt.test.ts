import { elasticsearchOperatorGtPlugin } from "../../../../src/elasticsearch/operators/gt";
import { createBlankQuery } from "../helpers";
import { ElasticsearchQuery } from "@webiny/api-plugin-elastic-search-client/types";

describe("elasticsearchOperatorGtPlugin", () => {
    const plugin = elasticsearchOperatorGtPlugin();
    const context: any = {};

    it("should apply gt correctly", () => {
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
                            gt: 100
                        }
                    }
                }
            ],
            filter: [],
            should: []
        };

        expect(query).toEqual(expected);
    });

    it("should apply multiple gt correctly", () => {
        const query = createBlankQuery();
        plugin.apply(query, {
            value: 100,
            field: "id",
            context
        });

        const from = new Date();
        plugin.apply(query, {
            value: from,
            field: "date",
            context
        });

        const expected: ElasticsearchQuery = {
            mustNot: [],
            must: [
                {
                    range: {
                        id: {
                            gt: 100
                        }
                    }
                },
                {
                    range: {
                        date: {
                            gt: from
                        }
                    }
                }
            ],
            filter: [],
            should: []
        };
        expect(query).toEqual(expected);
    });
});
