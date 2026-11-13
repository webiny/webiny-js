import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { ConcurrencySlots } from "~/ConcurrencySlots.js";

describe("ConcurrencySlots", () => {
    it("grants up to its size at once", async () => {
        const slots = new ConcurrencySlots(2);

        expect(await slots.acquire()).toBe(true);
        expect(await slots.acquire()).toBe(true);

        expect(slots.getRunning()).toBe(2);
    });

    it("makes the next caller wait for a slot, and hands it over in order", async () => {
        const slots = new ConcurrencySlots(1);
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
        const slots = new ConcurrencySlots(1);
        await slots.acquire();

        slots.release();

        expect(slots.getRunning()).toBe(0);
    });

    it("turns away those waiting, and later callers, once closed", async () => {
        const slots = new ConcurrencySlots(1);
        await slots.acquire();
        const waiting = slots.acquire();

        slots.close();

        expect(await waiting).toBe(false);
        expect(await slots.acquire()).toBe(false);
    });

    it("keeps counting slots held from before a close once opened again", async () => {
        const slots = new ConcurrencySlots(1);
        await slots.acquire();
        slots.close();

        slots.open();
        const waiting = slots.acquire();

        expect(slots.getRunning()).toBe(1);
        expect(slots.getWaiting()).toBe(1);
        slots.release();
        expect(await waiting).toBe(true);
    });

    it("refuses a size that is not a positive whole number", () => {
        expect(() => new ConcurrencySlots(0)).toThrow();
        expect(() => new ConcurrencySlots(-1)).toThrow();
        expect(() => new ConcurrencySlots(1.5)).toThrow();
        expect(() => new ConcurrencySlots(Number.NaN)).toThrow();
    });
});
