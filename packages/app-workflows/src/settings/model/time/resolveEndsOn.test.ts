import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { resolveEndsOn } from "./resolveEndsOn.js";

describe("resolveEndsOn (R319, D124)", () => {
    it("keeps the stored instant exactly when the date is unchanged, even if it is not at the end of a day", () => {
        const stored = "2026-10-20T15:00:00.000Z";

        const result = resolveEndsOn({
            pickedDate: "2026-10-20",
            originalDate: "2026-10-20",
            originalEndsOn: stored,
            timeZone: "Europe/Zagreb"
        });

        expect(result).toBe(stored);
    });

    it("is null when the date was cleared", () => {
        const result = resolveEndsOn({
            pickedDate: null,
            originalDate: "2026-10-20",
            originalEndsOn: "2026-10-20T21:59:59.999Z",
            timeZone: "Europe/Zagreb"
        });

        expect(result).toBeNull();
    });

    it("is null when there was no date and none is picked", () => {
        const result = resolveEndsOn({
            pickedDate: null,
            originalDate: null,
            originalEndsOn: null,
            timeZone: "Europe/Zagreb"
        });

        expect(result).toBeNull();
    });

    it("is the end of the newly picked day in the zone when the date changed", () => {
        const result = resolveEndsOn({
            pickedDate: "2026-10-21",
            originalDate: "2026-10-20",
            originalEndsOn: "2026-10-20T15:00:00.000Z",
            timeZone: "Europe/Zagreb"
        });

        expect(result).toBe("2026-10-21T21:59:59.999Z");
    });

    it("is the end of the picked day for a new entry", () => {
        const result = resolveEndsOn({
            pickedDate: "2026-11-01",
            originalDate: null,
            originalEndsOn: null,
            timeZone: "America/New_York"
        });

        expect(result).toBe("2026-11-02T04:59:59.999Z");
    });
});
