import { describe, expect, it } from "vitest";
import { toChunks } from "~/domain/toChunks.js";

const numbers = (count: number): number[] => Array.from({ length: count }, (_, index) => index);

describe("toChunks", () => {
    it("returns no chunks for no items", () => {
        expect(toChunks([], 50)).toEqual([]);
    });

    it("splits an exact multiple into full chunks", () => {
        const chunks = toChunks(numbers(100), 50);

        expect(chunks.map(chunk => chunk.length)).toEqual([50, 50]);
    });

    it("puts the remainder in a last, shorter chunk", () => {
        const chunks = toChunks(numbers(51), 50);

        expect(chunks.map(chunk => chunk.length)).toEqual([50, 1]);
        expect(chunks[1]).toEqual([50]);
    });

    it("keeps the order of the items", () => {
        expect(toChunks(numbers(5), 2)).toEqual([[0, 1], [2, 3], [4]]);
    });
});
