import { describe, expect, it } from "vitest";
import { groupByRevision, parseVersion } from "~/timeline/groupByRevision.js";
import { discloseItem, summariseItem } from "~/timeline/summariseItem.js";
import { collapseConsecutive } from "~/timeline/collapseConsecutive.js";
import type { TimelineRecord } from "~/timeline/types.js";

let seq = 0;

const record = (overrides: Partial<TimelineRecord> = {}): TimelineRecord => {
    seq++;
    return {
        id: `rec-${seq}`,
        targetType: "cms-entry",
        targetId: "abc",
        revision: "abc#0001",
        timestamp: "2026-09-10T10:00:00.000Z",
        actor: { id: "u-1", type: "admin", displayName: "Ada" },
        action: "entry.update",
        source: "admin",
        correlationId: `corr-${seq}`,
        changeset: [],
        truncated: false,
        ...overrides
    };
};

const at = (day: number, minutes: number) =>
    new Date(Date.UTC(2026, 8, day, 10, minutes, 0)).toISOString();

describe("parseVersion", () => {
    it("reads the version from a revision id", () => {
        expect(parseVersion("abc#0004")).toBe(4);
    });

    it("returns null rather than NaN for an unexpected shape", () => {
        // A caller rendering "v4" should show nothing rather than "vNaN".
        expect(parseVersion("abc")).toBeNull();
        expect(parseVersion("")).toBeNull();
    });
});

describe("groupByRevision", () => {
    it("groups activity under its revision", () => {
        const groups = groupByRevision([
            record({ revision: "abc#0002", timestamp: at(10, 30) }),
            record({ revision: "abc#0001", timestamp: at(10, 10) })
        ]);

        expect(groups.map(g => g.revision)).toEqual(["abc#0002", "abc#0001"]);
    });

    it("orders groups by their newest activity, not by version", () => {
        // A review transition can land on an older revision after work started on a newer one.
        // Ordering by version would put stale activity above fresh activity.
        const groups = groupByRevision([
            record({ revision: "abc#0001", timestamp: at(11, 0), action: "review.step.approved" }),
            record({ revision: "abc#0002", timestamp: at(10, 0) })
        ]);

        expect(groups.map(g => g.revision)).toEqual(["abc#0001", "abc#0002"]);
    });

    it("exposes the version for display, and null when absent", () => {
        const groups = groupByRevision([
            record({ revision: "abc#0003" }),
            record({ revision: "legacy", timestamp: at(9, 0) })
        ]);

        expect(groups.find(g => g.revision === "abc#0003")!.version).toBe(3);
        expect(groups.find(g => g.revision === "legacy")!.version).toBeNull();
    });

    it("orders records within a group newest first, whatever order they arrived in", () => {
        const groups = groupByRevision([
            record({ timestamp: at(10, 10) }),
            record({ timestamp: at(10, 40) }),
            record({ timestamp: at(10, 25) })
        ]);

        expect(groups[0]!.items[0]!.latest.timestamp).toBe(at(10, 40));
    });

    it("collapses within a group", () => {
        const groups = groupByRevision([
            record({ timestamp: at(10, 20) }),
            record({ timestamp: at(10, 15) }),
            record({ timestamp: at(10, 10) })
        ]);

        expect(groups[0]!.items).toHaveLength(1);
        expect(groups[0]!.items[0]!.records).toHaveLength(3);
    });

    it("reports the group's span", () => {
        const groups = groupByRevision([
            record({ timestamp: at(10, 40) }),
            record({ timestamp: at(10, 5) })
        ]);

        expect(groups[0]!.latestTimestamp).toBe(at(10, 40));
        expect(groups[0]!.earliestTimestamp).toBe(at(10, 5));
    });

    it("returns nothing for no records", () => {
        expect(groupByRevision([])).toEqual([]);
    });
});

describe("summariseItem", () => {
    it("says how much changed, not what", () => {
        // A closed row that already named every field would make expanding pointless.
        const [item] = collapseConsecutive([
            record({
                changeset: [
                    { path: "title", label: "Title" },
                    { path: "body", label: "Body" }
                ]
            })
        ]);

        const summary = summariseItem(item!);

        expect(summary.changedFieldCount).toBe(2);
        expect(Object.keys(summary)).not.toContain("changeset");
    });

    it("counts the records a collapsed row stands for", () => {
        const [item] = collapseConsecutive([
            record({ timestamp: at(10, 20) }),
            record({ timestamp: at(10, 15) })
        ]);

        expect(summariseItem(item!).occurrences).toBe(2);
        expect(summariseItem(item!).spansTime).toBe(true);
    });

    it("does not claim a span for a single record", () => {
        const [item] = collapseConsecutive([record()]);

        expect(summariseItem(item!).spansTime).toBe(false);
    });

    it("reports a redacted actor as redacted rather than as a blank name", () => {
        const [item] = collapseConsecutive([
            record({ actor: { id: "", type: "", displayName: "" } })
        ]);

        const summary = summariseItem(item!);

        expect(summary.actorRedacted).toBe(true);
        expect(summary.actorDisplayName).toBeNull();
    });

    it("surfaces the review step and whether a note was left", () => {
        const [item] = collapseConsecutive([
            record({
                action: "review.step.approved",
                subject: { id: "s1", label: "Legal review" },
                hasNote: true
            })
        ]);

        const summary = summariseItem(item!);

        expect(summary.subjectLabel).toBe("Legal review");
        expect(summary.hasNote).toBe(true);
    });

    it("treats an absent note as no note", () => {
        const [item] = collapseConsecutive([record({ action: "review.step.approved" })]);

        expect(summariseItem(item!).hasNote).toBe(false);
    });
});

describe("discloseItem", () => {
    it("describes each changed path readably", () => {
        const [item] = collapseConsecutive([
            record({
                changeset: [{ path: "sections#a1b2c3d4e5f6.blocks[2].title", label: "Title" }]
            })
        ]);

        expect(discloseItem(item!).changes[0]!.text).toBe("Sections › Blocks › Title");
    });

    it("states that values are not available rather than leaving it to be inferred", () => {
        // The feature records no content values by design. An empty space would read as a bug.
        const [item] = collapseConsecutive([record()]);

        expect(discloseItem(item!).valuesAvailable).toBe(false);
    });

    it("never carries a value, whatever the changeset holds", () => {
        // Asserted on the shape rather than by searching the JSON for "value" — that matched the
        // legitimate `valuesAvailable` flag and would have passed for the wrong reason.
        const [item] = collapseConsecutive([
            record({ changeset: [{ path: "salary", label: "Salary" }] })
        ]);

        const disclosure = discloseItem(item!);

        expect(Object.keys(disclosure).sort()).toEqual(["changes", "truncated", "valuesAvailable"]);

        for (const change of disclosure.changes) {
            expect(Object.keys(change).sort()).toEqual(["ancestors", "label", "operation", "text"]);
        }
    });

    it("says so when the list is incomplete", () => {
        // A truncated list rendered as complete is worse than no list: a reader would conclude
        // the unlisted fields did not change.
        const [item] = collapseConsecutive([record({ truncated: true })]);

        expect(discloseItem(item!).truncated).toBe(true);
    });
});
