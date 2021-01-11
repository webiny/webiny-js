import { elasticSearchQueryBuilderBetweenPlugin } from "../../../src/content/plugins/es/elasticSearchQueryBuilderBetweenPlugin";
import { createBlankQuery } from "./helpers";
import { ElasticSearchQuery } from "@webiny/api-headless-cms/types";

describe("elasticSearchQueryBuilderBetweenPlugin", () => {
    const plugin = elasticSearchQueryBuilderBetweenPlugin();

    it("should apply between correctly", () => {
        const query = createBlankQuery();
        plugin.apply(query, {
            value: [100, 110],
            field: "id"
        });

        const expected: ElasticSearchQuery = {
            mustNot: [],
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
            match: [],
            should: []
        };

        expect(query).toEqual(expected);
    });

    it("should apply multiple between correctly", () => {
        const query = createBlankQuery();
        plugin.apply(query, {
            value: [100, 110],
            field: "id"
        });

        const from = new Date();
        const to = new Date();
        to.setTime(from.getTime() + 1000000);
        plugin.apply(query, {
            value: [from, to],
            field: "date"
        });

        const expected: ElasticSearchQuery = {
            mustNot: [],
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
                            lte: to,
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

    it("should throw an error when array not sent", () => {
        const query = createBlankQuery();

        expect(() => {
            plugin.apply(query, {
                value: "notAnArray",
                field: "id"
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
                    field: "id"
                });
            }).toThrow(`You must pass 2 values in the array for field "id" filtering.`);
        }
    );
});
