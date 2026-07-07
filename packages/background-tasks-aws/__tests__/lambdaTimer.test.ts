import { describe, expect, it } from "vitest";
import { LambdaTimer } from "~/timer/LambdaTimer.js";

describe("LambdaTimer", () => {
    it("should delegate getRemainingMilliseconds to factory", () => {
        const timer = new LambdaTimer({ getRemainingTimeInMillis: () => 5000 });

        expect(timer.getRemainingMilliseconds()).toBe(5000);
    });

    it("should return floored seconds from milliseconds", () => {
        const timer = new LambdaTimer({ getRemainingTimeInMillis: () => 7500 });

        expect(timer.getRemainingSeconds()).toBe(7);
    });

    it("should reflect changing factory values", () => {
        let remaining = 10_000;
        const timer = new LambdaTimer({
            getRemainingTimeInMillis: () => remaining
        });

        expect(timer.getRemainingMilliseconds()).toBe(10_000);

        remaining = 3000;
        expect(timer.getRemainingMilliseconds()).toBe(3000);

        remaining = 0;
        expect(timer.getRemainingMilliseconds()).toBe(0);
        expect(timer.getRemainingSeconds()).toBe(0);
    });

    it("should handle zero remaining time", () => {
        const timer = new LambdaTimer({ getRemainingTimeInMillis: () => 0 });

        expect(timer.getRemainingMilliseconds()).toBe(0);
        expect(timer.getRemainingSeconds()).toBe(0);
    });

    it("should handle sub-second remaining time", () => {
        const timer = new LambdaTimer({ getRemainingTimeInMillis: () => 999 });

        expect(timer.getRemainingMilliseconds()).toBe(999);
        expect(timer.getRemainingSeconds()).toBe(0);
    });
});
