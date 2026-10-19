import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { formatUntilTitle } from "./formatUntilTitle.js";

const END_OF_20_OCT_ZAGREB = "2026-10-20T21:59:59.999Z";

const shortZoneName = (instant: string, timeZone: string): string => {
    const formatter = new Intl.DateTimeFormat("en-GB", { timeZone, timeZoneName: "short" });
    const time = Date.parse(instant);
    const parts = formatter.formatToParts(time);
    const part = parts.find(candidate => candidate.type === "timeZoneName");
    if (!part) {
        return "";
    }
    return part.value;
};

describe("formatUntilTitle (R320, QBZ-95)", () => {
    it("says Until removed without an end date", () => {
        expect(formatUntilTitle(null, "Europe/Zagreb")).toBe("Until removed");
    });

    it("writes the full time with the short zone name and the IANA zone, without a comma after the weekday", () => {
        const title = formatUntilTitle(END_OF_20_OCT_ZAGREB, "Europe/Zagreb");

        expect(title).toBe("Tue 20 Oct 2026, 23:59 CEST (Europe/Zagreb)");
        expect(title).not.toContain("Tue,");
    });

    it("shows UTC twice when the zone is the UTC fallback", () => {
        expect(formatUntilTitle(END_OF_20_OCT_ZAGREB, "UTC")).toBe(
            "Tue 20 Oct 2026, 21:59 UTC (UTC)"
        );
    });

    it("uses ICU's short zone name for New York and Tokyo", () => {
        const newYorkZone = shortZoneName(END_OF_20_OCT_ZAGREB, "America/New_York");
        const tokyoZone = shortZoneName(END_OF_20_OCT_ZAGREB, "Asia/Tokyo");

        expect(formatUntilTitle(END_OF_20_OCT_ZAGREB, "America/New_York")).toBe(
            `Tue 20 Oct 2026, 17:59 ${newYorkZone} (America/New_York)`
        );
        expect(formatUntilTitle(END_OF_20_OCT_ZAGREB, "Asia/Tokyo")).toBe(
            `Wed 21 Oct 2026, 06:59 ${tokyoZone} (Asia/Tokyo)`
        );
    });

    it("writes September as Sep (R339)", () => {
        expect(formatUntilTitle("2026-09-03T21:59:59.999Z", "Europe/Zagreb")).toBe(
            "Thu 3 Sep 2026, 23:59 CEST (Europe/Zagreb)"
        );
    });
});
