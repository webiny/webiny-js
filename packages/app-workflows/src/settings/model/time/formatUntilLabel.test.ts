import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { formatUntilLabel } from "./formatUntilLabel.js";
import { getEndOfLocalDay } from "./getEndOfLocalDay.js";

const END_OF_20_OCT_ZAGREB = "2026-10-20T21:59:59.999Z";

describe("formatUntilLabel (R320, QBZ-95)", () => {
    it("says Until removed without an end date", () => {
        expect(formatUntilLabel(null, "Europe/Zagreb")).toBe("Until removed");
    });

    it("says End of the day when the end is at 23:59 in the viewer's zone", () => {
        expect(formatUntilLabel(END_OF_20_OCT_ZAGREB, "Europe/Zagreb")).toBe("End of 20 Oct 2026");
    });

    it("writes September as Sep, not as ICU's Sept (R339)", () => {
        expect(formatUntilLabel("2026-09-03T21:59:59.999Z", "Europe/Zagreb")).toBe(
            "End of 3 Sep 2026"
        );
    });

    it("writes the date and the time when the end is not at 23:59 in the viewer's zone", () => {
        expect(formatUntilLabel(END_OF_20_OCT_ZAGREB, "America/New_York")).toBe(
            "20 Oct 2026, 17:59"
        );
        expect(formatUntilLabel(END_OF_20_OCT_ZAGREB, "Asia/Tokyo")).toBe("21 Oct 2026, 06:59");
        expect(formatUntilLabel(END_OF_20_OCT_ZAGREB, "UTC")).toBe("20 Oct 2026, 21:59");
    });

    it("says End of for any instant in the 23:59 minute and not for 23:58", () => {
        expect(formatUntilLabel("2026-10-20T21:59:00.000Z", "Europe/Zagreb")).toBe(
            "End of 20 Oct 2026"
        );
        expect(formatUntilLabel("2026-10-20T21:58:59.999Z", "Europe/Zagreb")).toBe(
            "20 Oct 2026, 23:58"
        );
    });

    it("says End of the DST end day for an end picked on that day", () => {
        const zagreb = getEndOfLocalDay("2026-10-25", "Europe/Zagreb");
        const newYork = getEndOfLocalDay("2026-11-01", "America/New_York");

        expect(formatUntilLabel(zagreb, "Europe/Zagreb")).toBe("End of 25 Oct 2026");
        expect(formatUntilLabel(newYork, "America/New_York")).toBe("End of 1 Nov 2026");
    });
});
