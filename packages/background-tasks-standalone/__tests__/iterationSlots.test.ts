import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { IterationSlots } from "~/loop/IterationSlots.js";

describe("IterationSlots", () => {
    it("grants up to its size at once", async () => {
        const slots = new IterationSlots(2);

        expect(await slots.acquire()).toBe(true);
        expect(await slots.acquire()).toBe(true);

        expect(slots.getRunning()).toBe(2);
    });

    it("makes the next caller wait for a slot, and hands it over in order", async () => {
        const slots = new IterationSlots(1);
        await slots.acquire();
        const order: string[] = [];

        const second = slots.acquire().then(() => order.push("second"));
        const third = slots.acquire().then(() => order.push("third"));
        expect(slots.getWaiting()).toBe(2);

        slots.release();
        await second;
        slots.release();
        await third;

        expect(order).toEqual(["second", "third"]);
        expect(slots.getRunning()).toBe(1);
    });

    it("frees a slot nobody is waiting for", async () => {
        const slots = new IterationSlots(1);
        await slots.acquire();

        slots.release();

        expect(slots.getRunning()).toBe(0);
    });

    it("turns away those waiting, and later callers, once closed", async () => {
        const slots = new IterationSlots(1);
        await slots.acquire();
        const waiting = slots.acquire();

        slots.close();

        expect(await waiting).toBe(false);
        expect(await slots.acquire()).toBe(false);
    });
});
