import { describe, it, expect } from "vitest";
import { timerFactory } from "~/utils/timer/index.js";

describe("timerFactory", () => {
    it("uses the provided getRemainingTimeInMillis", () => {
        const timer = timerFactory({ getRemainingTimeInMillis: () => 5400 });
        expect(timer.getRemainingMilliseconds()).toBe(5400);
        expect(timer.getRemainingSeconds()).toBe(5);
    });

    it("reports zero remaining seconds when no time is left", () => {
        const timer = timerFactory({ getRemainingTimeInMillis: () => 0 });
        expect(timer.getRemainingSeconds()).toBe(0);
    });

    it("falls back to an internal timer when no param is given", () => {
        const timer = timerFactory();
        expect(timer.getRemainingMilliseconds()).toBeGreaterThan(0);
        expect(timer.getRemainingSeconds()).toBeGreaterThanOrEqual(0);
    });
});
