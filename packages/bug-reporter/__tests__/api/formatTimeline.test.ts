import { describe, it, expect } from "vitest";
import { formatTimeline } from "~/api/formatTimeline.js";
import type { IReportedEvent } from "~/shared/types.js";

const REPORTED_AT = 1_000_000;

describe("formatTimeline", () => {
    it("says so when nothing was recorded, rather than returning an empty section", () => {
        expect(formatTimeline([], REPORTED_AT)).toBe("_Nothing was recorded._");
    });

    it("timestamps each event relative to when the report was filed", () => {
        const events: IReportedEvent[] = [
            { at: REPORTED_AT - 12_300, kind: "route", summary: "/admin/pages" },
            { at: REPORTED_AT - 500, kind: "click", summary: "Publish" }
        ];

        expect(formatTimeline(events, REPORTED_AT)).toBe(
            ["- `-12.3s` **nav** /admin/pages", "- `-0.5s` **click** Publish"].join("\n")
        );
    });

    it("keeps an unknown kind as its own label instead of dropping the event", () => {
        const events: IReportedEvent[] = [{ at: REPORTED_AT, kind: "teleport", summary: "hi" }];

        expect(formatTimeline(events, REPORTED_AT)).toBe("- `-0.0s` **teleport** hi");
    });

    it("puts a detail on its own line so it cannot break the list item", () => {
        const events: IReportedEvent[] = [
            { at: REPORTED_AT, kind: "exception", summary: "TypeError", detail: "x is not a fn" }
        ];

        expect(formatTimeline(events, REPORTED_AT)).toBe(
            "- `-0.0s` **error** TypeError\n  <br>`x is not a fn`"
        );
    });
});
