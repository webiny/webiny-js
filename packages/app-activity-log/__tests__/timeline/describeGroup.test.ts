import { describe, expect, it } from "vitest";
import { describeGroup, formatDateRange, formatNameList } from "~/timeline/describeGroup.js";
import { describeTimeline } from "~/timeline/describeTimeline.js";
import { groupByRevision } from "~/timeline/groupByRevision.js";
import type { TimelineRecord } from "~/timeline/types.js";

/**
 * The revision header, which is what makes the design's central relationship readable: one
 * revision holds many saves, by several people, over days.
 */

let seq = 0;

const record = (overrides: Partial<TimelineRecord> = {}): TimelineRecord => {
    seq++;
    return {
        id: `rec-${seq}`,
        targetType: "cms-entry",
        targetId: "abc",
        revision: "abc#0002",
        timestamp: "2026-09-10T10:00:00.000Z",
        actor: { id: "u-1", type: "admin", displayName: "Nina Kovač" },
        action: "entry.update",
        source: "admin",
        correlationId: `corr-${seq}`,
        changeset: [],
        truncated: false,
        ...overrides
    };
};

describe("formatDateRange", () => {
    it("collapses a single day", () => {
        expect(formatDateRange("2026-08-28T09:00:00.000Z", "2026-08-28T17:00:00.000Z")).toBe(
            "28 Aug"
        );
    });

    it("shares the month across a range", () => {
        expect(formatDateRange("2026-09-01T09:00:00.000Z", "2026-09-02T17:00:00.000Z")).toBe(
            "1–2 Sep"
        );
    });

    it("names both months when the range crosses one", () => {
        expect(formatDateRange("2026-08-28T09:00:00.000Z", "2026-09-02T17:00:00.000Z")).toBe(
            "28 Aug – 2 Sep"
        );
    });

    it("returns nothing for an unparseable timestamp rather than a broken range", () => {
        expect(formatDateRange("not a date", "2026-09-02T17:00:00.000Z")).toBe("");
    });
});

describe("formatNameList", () => {
    it("joins the way a person would", () => {
        expect(formatNameList(["A"])).toBe("A");
        expect(formatNameList(["A", "B"])).toBe("A and B");
        expect(formatNameList(["A", "B", "C"])).toBe("A, B and C");
    });

    it("counts the rest past three, so a busy revision keeps its header", () => {
        expect(formatNameList(["A", "B", "C", "D", "E"])).toBe("A, B and 3 others");
    });

    it("returns nothing for nobody", () => {
        expect(formatNameList([])).toBe("");
    });
});

describe("describeGroup", () => {
    it("names the revision, counts its saves and dates them", () => {
        const at = (day: number) => new Date(Date.UTC(2026, 8, day, 10)).toISOString();
        const group = groupByRevision([
            record({ timestamp: at(2) }),
            record({ timestamp: at(1), action: "entry.publish" })
        ])[0]!;

        const described = describeGroup(group);

        expect(described.label).toBe("Revision 2");
        expect(described.meta).toBe("2 saves · 1–2 Sep");
    });

    it("lists who was involved, without repeating anyone", () => {
        const at = (day: number) => new Date(Date.UTC(2026, 8, day, 10)).toISOString();
        const group = groupByRevision([
            record({ timestamp: at(3) }),
            record({ timestamp: at(2), action: "entry.publish" }),
            record({
                timestamp: at(1),
                actor: { id: "u-2", type: "admin", displayName: "Marko Ilić" }
            })
        ])[0]!;

        expect(describeGroup(group).who).toBe("Nina Kovač and Marko Ilić");
    });

    it("falls back to the raw revision id when it carries no version", () => {
        const group = groupByRevision([record({ revision: "legacy-id" })])[0]!;

        expect(describeGroup(group).label).toBe("legacy-id");
    });
});

describe("describeTimeline", () => {
    it("keeps the count honest while older activity is unloaded", () => {
        // Only part of the history is loaded at any time, so a bare "12 saves" would be a claim
        // the panel cannot support.
        const groups = groupByRevision([record(), record()]);

        expect(describeTimeline({ groups, filtersActive: false, hasMore: true })).toContain(
            "loaded · older activity available"
        );
    });

    it("states retention once everything is in", () => {
        // Retention is a property a reader has no other way to learn, and it is why a long
        // timeline is expected rather than a sign something is wrong.
        const groups = groupByRevision([record()]);

        expect(describeTimeline({ groups, filtersActive: false, hasMore: false })).toBe(
            "1 save across 1 revision · kept permanently"
        );
    });

    it("counts matches rather than the whole under a filter", () => {
        const groups = groupByRevision([record(), record()]);

        expect(describeTimeline({ groups, filtersActive: true, hasMore: false })).toBe(
            "2 saves across 1 revision match"
        );
    });

    it("says nothing matched rather than claiming an empty history", () => {
        expect(describeTimeline({ groups: [], filtersActive: true, hasMore: false })).toBe(
            "No activity matches these filters"
        );
    });

    it("stays silent when there is nothing to describe", () => {
        // The empty state speaks for itself; a summary line above it would be noise.
        expect(describeTimeline({ groups: [], filtersActive: false, hasMore: false })).toBe("");
    });
});
