import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { getTodayLocalDate } from "./getTodayLocalDate.js";

describe("getTodayLocalDate (R319)", () => {
    it("is today in the zone, not in UTC", () => {
        const now = Date.parse("2026-10-19T22:30:00.000Z");

        expect(getTodayLocalDate(now, "Europe/Zagreb")).toBe("2026-10-20");
        expect(getTodayLocalDate(now, "Asia/Tokyo")).toBe("2026-10-20");
        expect(getTodayLocalDate(now, "America/New_York")).toBe("2026-10-19");
        expect(getTodayLocalDate(now, "UTC")).toBe("2026-10-19");
    });
});
