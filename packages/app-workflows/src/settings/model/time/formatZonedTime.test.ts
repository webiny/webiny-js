import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import type { ZonedDateParts } from "./ZonedDateParts.js";
import { formatZonedTime } from "./formatZonedTime.js";

const createParts = (hour: number, minute: number): ZonedDateParts => {
    return {
        year: 2026,
        month: 10,
        day: 20,
        hour,
        minute,
        second: 0,
        weekday: "Tue",
        zoneName: "CEST"
    };
};

describe("formatZonedTime", () => {
    it("writes a padded 24-hour HH:mm", () => {
        const morning = createParts(6, 5);
        const midnight = createParts(0, 0);
        const evening = createParts(23, 59);

        expect(formatZonedTime(morning)).toBe("06:05");
        expect(formatZonedTime(midnight)).toBe("00:00");
        expect(formatZonedTime(evening)).toBe("23:59");
    });
});
