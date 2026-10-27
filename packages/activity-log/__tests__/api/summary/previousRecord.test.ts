import { describe, expect, it } from "vitest";
import { dispositionOfPrevious } from "~/api/cms/summary/previousRecord.js";

const NOW = Date.UTC(2026, 9, 26, 12, 0, 0);
const DEBOUNCE = 60 * 1000;
const SWEEP = 60 * 60 * 1000;

const at = (msAgo: number) => new Date(NOW - msAgo).toISOString();

const disposition = (overrides: Partial<Parameters<typeof dispositionOfPrevious>[0]> = {}) =>
    dispositionOfPrevious({
        pending: true,
        valuesWrittenOn: at(0),
        now: NOW,
        debounceWindowMs: DEBOUNCE,
        sweepThresholdMs: SWEEP,
        ...overrides
    });

describe("dispositionOfPrevious", () => {
    it("joins a run inside the debounce window", () => {
        expect(disposition({ valuesWrittenOn: at(0) })).toBe("run");
        expect(disposition({ valuesWrittenOn: at(DEBOUNCE) })).toBe("run");
    });

    it("reclaims values that have outlived any job that could consume them", () => {
        expect(disposition({ valuesWrittenOn: at(SWEEP) })).toBe("reclaim");
        expect(disposition({ valuesWrittenOn: at(SWEEP * 10) })).toBe("reclaim");
    });

    it("leaves a job that is plausibly still running alone", () => {
        // The gap between the two thresholds, and the reason it exists: clearing here would race a
        // live job for its own values and cost a summary that was about to be written. The
        // scheduled sweep picks these up an hour later at no risk.
        expect(disposition({ valuesWrittenOn: at(DEBOUNCE + 1) })).toBe("ignore");
        expect(disposition({ valuesWrittenOn: at(SWEEP / 2) })).toBe("ignore");
        expect(disposition({ valuesWrittenOn: at(SWEEP - 1) })).toBe("ignore");
    });

    it("ignores a record that is not pending", () => {
        // Its values are already gone. Settling it again would be a write that changes nothing.
        expect(disposition({ pending: false, valuesWrittenOn: at(SWEEP * 5) })).toBe("ignore");
    });

    it("ignores a record with no timestamp to age against", () => {
        expect(disposition({ valuesWrittenOn: undefined })).toBe("ignore");
    });

    it("ignores an unparseable timestamp rather than guessing", () => {
        // Guessing wrong here destroys values a running job still needs. The scheduled sweep
        // compares storage-side and is not fooled by this.
        expect(disposition({ valuesWrittenOn: "not a date" })).toBe("ignore");
    });

    it("never reclaims a record from the future", () => {
        // Clock skew between writers. A negative age is inside the debounce window, so this joins
        // a run rather than clearing something just written.
        expect(disposition({ valuesWrittenOn: at(-5000) })).toBe("run");
    });
});
