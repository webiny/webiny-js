import { getBackOffSeconds, min, max } from "~/tasks/utils/helpers/getBackOffSeconds";

describe("get back off seconds", () => {
    const values: [number, number][] = [
        [0, min],
        [1, min],
        [2, 20],
        [3, 30],
        [4, 40],
        [5, 50],
        [6, 60],
        [7, 70],
        [8, 80],
        [9, max],
        [10, max],
        [11, max],
        [12, max],
        [13, max],
        [14, max],
        [15, max]
    ];

    it.each(values)("should return %s0 seconds - #%s", (iterations, expected) => {
        const result = getBackOffSeconds(iterations);

        expect(result).toBe(expected);
    });
});
