import { describe, expect, it } from "vitest";
import { ProcessTimer } from "~/timer/ProcessTimer.js";

describe("ProcessTimer", () => {
    it("should return remaining milliseconds close to max on creation", () => {
        const timer = new ProcessTimer(5000);
        const remaining = timer.getRemainingMilliseconds();

        expect(remaining).toBeGreaterThan(4900);
        expect(remaining).toBeLessThanOrEqual(5000);
    });

    it("should return remaining seconds as floored milliseconds / 1000", () => {
        const timer = new ProcessTimer(10_000);
        const seconds = timer.getRemainingSeconds();

        expect(seconds).toBe(Math.floor(timer.getRemainingMilliseconds() / 1000));
    });

    it("should count down over time", async () => {
        const timer = new ProcessTimer(1000);
        const before = timer.getRemainingMilliseconds();

        await new Promise(resolve => setTimeout(resolve, 100));

        const after = timer.getRemainingMilliseconds();
        expect(after).toBeLessThan(before);
        expect(before - after).toBeGreaterThanOrEqual(80);
    });

    it("should return 0 when max duration is exceeded", async () => {
        const timer = new ProcessTimer(50);

        await new Promise(resolve => setTimeout(resolve, 80));

        expect(timer.getRemainingMilliseconds()).toBe(0);
        expect(timer.getRemainingSeconds()).toBe(0);
    });

    it("should default to 24 hours when no duration provided", () => {
        const timer = new ProcessTimer();
        const remaining = timer.getRemainingMilliseconds();

        expect(remaining).toBeGreaterThan(86_399_000);
        expect(remaining).toBeLessThanOrEqual(86_400_000);
    });
});
