import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { getEndOfLocalDay } from "./getEndOfLocalDay.js";
import { getLocalDate } from "./getLocalDate.js";

describe("getEndOfLocalDay (R319, D179)", () => {
    it("is 23:59:59.999 of the picked day in the zone, as UTC", () => {
        expect(getEndOfLocalDay("2026-10-20", "Europe/Zagreb")).toBe("2026-10-20T21:59:59.999Z");
        expect(getEndOfLocalDay("2026-10-20", "Asia/Tokyo")).toBe("2026-10-20T14:59:59.999Z");
        expect(getEndOfLocalDay("2026-10-20", "UTC")).toBe("2026-10-20T23:59:59.999Z");
        expect(getEndOfLocalDay("2026-10-20", "America/New_York")).toBe("2026-10-21T03:59:59.999Z");
    });

    it("uses the offset after the change on a DST end day", () => {
        expect(getEndOfLocalDay("2026-10-25", "Europe/Zagreb")).toBe("2026-10-25T22:59:59.999Z");
        expect(getEndOfLocalDay("2026-11-01", "America/New_York")).toBe("2026-11-02T04:59:59.999Z");
    });

    it("uses the offset after the change on a DST start day", () => {
        expect(getEndOfLocalDay("2026-03-29", "Europe/Zagreb")).toBe("2026-03-29T21:59:59.999Z");
        expect(getEndOfLocalDay("2026-03-08", "America/New_York")).toBe("2026-03-09T03:59:59.999Z");
    });

    it("stays on the picked local day in every zone", () => {
        const zones = ["Europe/Zagreb", "America/New_York", "Asia/Tokyo", "UTC"];

        for (const zone of zones) {
            const endsOn = getEndOfLocalDay("2026-10-25", zone);

            expect(getLocalDate(endsOn, zone)).toBe("2026-10-25");
        }
    });
});
