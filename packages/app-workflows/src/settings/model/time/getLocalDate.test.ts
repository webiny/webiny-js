import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { getLocalDate } from "./getLocalDate.js";

describe("getLocalDate (R319)", () => {
    it("is the yyyy-MM-dd of the instant in the zone", () => {
        const instant = "2026-10-20T21:59:59.999Z";

        expect(getLocalDate(instant, "Europe/Zagreb")).toBe("2026-10-20");
        expect(getLocalDate(instant, "America/New_York")).toBe("2026-10-20");
        expect(getLocalDate(instant, "Asia/Tokyo")).toBe("2026-10-21");
        expect(getLocalDate(instant, "UTC")).toBe("2026-10-20");
    });

    it("counts local midnight to the new day and pads month and day", () => {
        expect(getLocalDate("2026-10-19T22:00:00.000Z", "Europe/Zagreb")).toBe("2026-10-20");
        expect(getLocalDate("2026-10-19T21:59:59.999Z", "Europe/Zagreb")).toBe("2026-10-19");
        expect(getLocalDate("2026-03-04T12:00:00.000Z", "UTC")).toBe("2026-03-04");
    });
});
