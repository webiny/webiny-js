import { describe, expect, it } from "vitest";
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

const at = (minutes: number) => new Date(Date.UTC(2026, 8, 10, 10, minutes, 0)).toISOString();

describe("collapseConsecutive", () => {
    it("merges a run of saves by one person into one row", () => {
        const items = collapseConsecutive([
            record({ timestamp: at(20) }),
            record({ timestamp: at(15) }),
            record({ timestamp: at(10) })
        ]);

        expect(items).toHaveLength(1);
        expect(items[0]!.records).toHaveLength(3);
    });

    it("keeps the newest record as the row's anchor", () => {
        const items = collapseConsecutive([
            record({ timestamp: at(20) }),
            record({ timestamp: at(10) })
        ]);

        expect(items[0]!.latest.timestamp).toBe(at(20));
        expect(items[0]!.earliestTimestamp).toBe(at(10));
    });

    it("does not merge saves by different people", async () => {
        const items = collapseConsecutive([
            record({ timestamp: at(20) }),
            record({
                timestamp: at(15),
                actor: { id: "u-2", type: "admin", displayName: "Grace" }
            })
        ]);

        expect(items).toHaveLength(2);
    });

    it("does not merge two redacted actors, which would assert they are the same person", () => {
        // Exactly what a reader without actor identity is not allowed to infer.
        const redacted = { id: "", type: "", displayName: "" };
        const items = collapseConsecutive([
            record({ timestamp: at(20), actor: redacted }),
            record({ timestamp: at(15), actor: redacted })
        ]);

        expect(items).toHaveLength(2);
    });

    it("does not merge different actions", () => {
        const items = collapseConsecutive([
            record({ timestamp: at(20), action: "entry.publish" }),
            record({ timestamp: at(15), action: "entry.update" })
        ]);

        expect(items).toHaveLength(2);
    });

    it("does not merge two publishes, which are two events", () => {
        const items = collapseConsecutive([
            record({ timestamp: at(20), action: "entry.publish" }),
            record({ timestamp: at(15), action: "entry.publish" })
        ]);

        expect(items).toHaveLength(2);
    });

    it("does not merge across revisions", () => {
        const items = collapseConsecutive([
            record({ timestamp: at(20), revision: "abc#0002" }),
            record({ timestamp: at(15), revision: "abc#0001" })
        ]);

        expect(items).toHaveLength(2);
    });

    it("does not merge saves far apart in time", () => {
        // A save now and a save tomorrow are not one editing session.
        const items = collapseConsecutive([
            record({ timestamp: "2026-09-10T10:00:00.000Z" }),
            record({ timestamp: "2026-09-08T10:00:00.000Z" })
        ]);

        expect(items).toHaveLength(2);
    });

    it("respects a custom gap", () => {
        const items = collapseConsecutive(
            [record({ timestamp: at(20) }), record({ timestamp: at(10) })],
            { maxGapMs: 60 * 1000 }
        );

        expect(items).toHaveLength(2);
    });

    it("does not merge on an unparseable timestamp", () => {
        const items = collapseConsecutive([
            record({ timestamp: "not a date" }),
            record({ timestamp: at(10) })
        ]);

        expect(items).toHaveLength(2);
    });

    describe("merged changesets", () => {
        it("unions the changed paths", () => {
            const items = collapseConsecutive([
                record({ timestamp: at(20), changeset: [{ path: "body", label: "Body" }] }),
                record({ timestamp: at(15), changeset: [{ path: "title", label: "Title" }] })
            ]);

            expect(items[0]!.changeset.map(c => c.path)).toEqual(["body", "title"]);
        });

        it("deduplicates a field touched in several saves", () => {
            const items = collapseConsecutive([
                record({ timestamp: at(20), changeset: [{ path: "title", label: "Title" }] }),
                record({ timestamp: at(15), changeset: [{ path: "title", label: "Title" }] })
            ]);

            expect(items[0]!.changeset).toHaveLength(1);
        });

        it("keeps the newest label when a field was renamed between saves", () => {
            const items = collapseConsecutive([
                record({ timestamp: at(20), changeset: [{ path: "title", label: "Headline" }] }),
                record({ timestamp: at(15), changeset: [{ path: "title", label: "Title" }] })
            ]);

            expect(items[0]!.changeset[0]!.label).toBe("Headline");
        });

        it("treats the same path with different operations as distinct", () => {
            const items = collapseConsecutive([
                record({
                    timestamp: at(20),
                    changeset: [{ path: "sections#a", label: "Sections", operation: "moved" }]
                }),
                record({
                    timestamp: at(15),
                    changeset: [{ path: "sections#a", label: "Sections", operation: "added" }]
                })
            ]);

            expect(items[0]!.changeset).toHaveLength(2);
        });

        it("carries truncation forward if any merged record was truncated", () => {
            const items = collapseConsecutive([
                record({ timestamp: at(20), truncated: false }),
                record({ timestamp: at(15), truncated: true })
            ]);

            expect(items[0]!.truncated).toBe(true);
        });
    });

    it("returns nothing for no records", () => {
        expect(collapseConsecutive([])).toEqual([]);
    });

    it("leaves a single record as a single row", () => {
        const items = collapseConsecutive([record()]);

        expect(items).toHaveLength(1);
        expect(items[0]!.records).toHaveLength(1);
        expect(items[0]!.earliestTimestamp).toBe(items[0]!.latest.timestamp);
    });
});
