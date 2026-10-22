import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { toUtcIsoString } from "./DateTimeInput.js";

describe("toUtcIsoString", () => {
    const originalTz = process.env.TZ;

    beforeAll(() => {
        // UTC-04:00 on the dates below (EDT).
        process.env.TZ = "America/New_York";
    });

    afterAll(() => {
        process.env.TZ = originalTz;
    });

    it("converts the picker's local wall-clock value to the matching UTC instant", () => {
        // The user picks 09:00 local time; the picker emits it as "09:00Z".
        expect(toUtcIsoString("2026-10-02T09:00:00.000Z")).toBe("2026-10-02T13:00:00.000Z");
    });

    it("round-trips: a stored instant shown in local time is saved back unchanged", () => {
        const stored = "2026-10-02T14:00:00.000Z";
        // What the picker displays (local) and emits back with a "Z" suffix.
        const shown = new Date(stored);
        const pad = (n: number) => String(n).padStart(2, "0");
        const emitted = `${shown.getFullYear()}-${pad(shown.getMonth() + 1)}-${pad(
            shown.getDate()
        )}T${pad(shown.getHours())}:${pad(shown.getMinutes())}:00.000Z`;

        expect(toUtcIsoString(emitted)).toBe(stored);
    });

    it("keeps an empty value empty", () => {
        expect(toUtcIsoString(undefined)).toBeUndefined();
        expect(toUtcIsoString("")).toBeUndefined();
    });
});
