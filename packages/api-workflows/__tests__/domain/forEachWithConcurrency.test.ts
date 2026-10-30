import { describe, expect, it } from "vitest";
import { forEachWithConcurrency } from "~/domain/forEachWithConcurrency.js";

/** Runs the items, each held until the next macrotask, and records how many ran at once. */
const runHeld = async (items: number[], limit: number) => {
    const done: number[] = [];
    let inFlight = 0;
    let maxInFlight = 0;
    await forEachWithConcurrency(items, limit, async item => {
        inFlight++;
        maxInFlight = Math.max(maxInFlight, inFlight);
        await new Promise<void>(resolve => setTimeout(resolve, 0));
        inFlight--;
        done.push(item);
    });
    return { done, maxInFlight };
};

describe("forEachWithConcurrency", () => {
    it("runs every item once", async () => {
        const { done } = await runHeld([1, 2, 3, 4, 5, 6, 7], 3);

        expect([...done].sort()).toEqual([1, 2, 3, 4, 5, 6, 7]);
    });

    it("runs at most the limit at once", async () => {
        const { maxInFlight } = await runHeld(
            Array.from({ length: 12 }, (_, index) => index),
            5
        );

        expect(maxInFlight).toBe(5);
    });

    it("runs fewer at once when there are fewer items than the limit", async () => {
        const { maxInFlight } = await runHeld([1, 2], 5);

        expect(maxInFlight).toBe(2);
    });

    it("runs nothing for no items", async () => {
        const { done, maxInFlight } = await runHeld([], 5);

        expect(done).toEqual([]);
        expect(maxInFlight).toBe(0);
    });

    it("rejects the run when a task throws", async () => {
        await expect(
            forEachWithConcurrency([1, 2, 3], 2, async item => {
                if (item === 2) {
                    throw new Error("The task failed.");
                }
            })
        ).rejects.toThrow("The task failed.");
    });
});
