import { elasticSearchQueryBuilderBetweenPlugin } from "../../../src/content/plugins/es/elasticSearchQueryBuilderBetweenPlugin";
import { createBlankQuery } from "./helpers";

describe("elasticSearchQueryBuilderBetweenPlugin", () => {
    const plugin = elasticSearchQueryBuilderBetweenPlugin();

    it("should apply between correctly", () => {
        const query = createBlankQuery();
        plugin.apply(query, {
            value: [100, 110],
            field: "id"
        });

        expect(query).toEqual({
            range: [
                {
                    [`id.keyword`]: {
                        lte: 100,
                        gte: 110
                    }
                }
            ],
            mustNot: [],
            must: [],
            match: []
        });
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
            value: [from.toISOString(), to.toISOString()],
            field: "date"
        });

        expect(query).toEqual({
            range: [
                {
                    [`id.keyword`]: {
                        lte: 100,
                        gte: 110
                    }
                },
                {
                    [`date.keyword`]: {
                        lte: from.toISOString(),
                        gte: to.toISOString()
                    }
                }
            ],
            mustNot: [],
            must: [],
            match: []
        });
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
