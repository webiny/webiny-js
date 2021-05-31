import { elasticsearchOperatorBetweenPlugin } from "../../../../src/elasticsearch/operators/between";
import { createBlankQuery } from "../helpers";
import { ElasticsearchBoolQueryConfig } from "@webiny/api-plugin-elastic-search-client/types";

describe("elasticsearchOperatorBetweenPlugin", () => {
    const plugin = elasticsearchOperatorBetweenPlugin();
    const context: any = {};

    it("should apply between correctly", () => {
        const query = createBlankQuery();
        plugin.apply(query, {
            value: [100, 110],
            field: "id",
            context
        });

        const expected: ElasticsearchBoolQueryConfig = {
            must_not: [],
            must: [
                {
                    range: {
                        id: {
                            lte: 110,
                            gte: 100
                        }
                    }
                }
            ],
            filter: [],
            should: []
        };

        expect(query).toEqual(expected);
    });

    it("should apply multiple between correctly", () => {
        const query = createBlankQuery();
        plugin.apply(query, {
            value: [100, 110],
            field: "id",
            context
        });

        const from = new Date();
        const to = new Date();
        to.setTime(from.getTime() + 1000000);
        plugin.apply(query, {
            value: [from, to],
            field: "date",
            context
        });

        const expected: ElasticsearchBoolQueryConfig = {
            must_not: [],
            must: [
                {
                    range: {
                        id: {
                            lte: 110,
                            gte: 100
                        }
                    }
                },
                {
                    range: {
                        date: {
                            lte: to as any,
                            gte: from as any
                        }
                    }
                }
            ],
            filter: [],
            should: []
        };
        expect(query).toEqual(expected);
    });

    it("should throw an error when array not sent", () => {
        const query = createBlankQuery();

        expect(() => {
            plugin.apply(query, {
                value: "notAnArray",
                field: "id",
                context
            });
        }).toThrow(`You cannot filter "id" with between query and not send an array of values.`);
    });

    const values = [[[1, 2, 3]], [[1]]];

    it.each(values)(
        "should throw an error when passing array with more or less than two values",
        (value: number[]) => {
            const query = createBlankQuery();

            expect(() => {
                plugin.apply(query, {
                    value,
                    field: "id",
                    context
                });
            }).toThrow(`You must pass 2 values in the array for field "id" filtering.`);
        }
    );
});
