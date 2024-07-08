import { getBackOffSeconds } from "~/tasks/utils/helpers/getBackOffSeconds";

describe("get back off seconds", () => {
    const values: [number, number][] = [
        [0, 15],
        [1, 15],
        [2, 15],
        [3, 15],
        [4, 20],
        [5, 25],
        [6, 30],
        [7, 35],
        [8, 40],
        [9, 45],
        [10, 50],
        [11, 55],
        [12, 60],
        [13, 60],
        [14, 60],
        [15, 60]
    ];

    it.each(values)("should return %s seconds - #%s", (iterations, expected) => {
        const result = getBackOffSeconds(iterations);

        expect(result).toBe(expected);
    });
});
