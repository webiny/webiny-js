import { elasticsearchOperatorLtPlugin } from "../../../../src/elasticsearch/operators/lt";
import { createBlankQuery } from "../helpers";
import { ElasticsearchQuery } from "../../../../src/types";

describe("elasticsearchOperatorLtPlugin", () => {
    const plugin = elasticsearchOperatorLtPlugin();
    const context: any = {};

    it("should apply lt correctly", () => {
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
