import { describe, expect, it } from "vitest";
import { buildTimelineView, hasActiveFilters } from "~/admin/hooks/buildTimelineView.js";
import type { TimelineRecord } from "~/admin/timeline/types.js";

let seq = 0;

const record = (overrides: Partial<TimelineRecord> = {}): TimelineRecord => {
    seq++;
    return {
        id: `rec-${seq}`,
        targetType: "cms-entry",
        targetId: "abc",
        revision: "abc#0001",
        timestamp: `2026-09-10T10:${String(seq % 60).padStart(2, "0")}:00.000Z`,
        actor: { id: "u-1", type: "admin", displayName: "Ada" },
        action: "entry.update",
        source: "admin",
        correlationId: `corr-${seq}`,
        changeset: [],
        truncated: false,
        ...overrides
    };
};

describe("hasActiveFilters", () => {
    it("is false with no filters", () => {
        expect(hasActiveFilters({})).toBe(false);
    });

    it("is true for either filter", () => {
        expect(hasActiveFilters({ revision: "abc#0001" })).toBe(true);
        expect(hasActiveFilters({ actorId: "u-1" })).toBe(true);
    });

    it("ignores an empty string, which a cleared select produces", () => {
        expect(hasActiveFilters({ revision: "", actorId: "" })).toBe(false);
    });
});

describe("buildTimelineView", () => {
    it("groups, collapses and derives state in one pass", () => {
        const view = buildTimelineView({
            records: [record({ action: "entry.create" }), record()],
            filters: {},
            hasMore: false
        });

        expect(view.state.status).toBe("populated");
        expect(view.state.coverage).toEqual({ kind: "complete" });
        expect(view.groups).toHaveLength(1);
    });

    it("reports the unrecorded state for an entry with nothing at all", () => {
        const view = buildTimelineView({ records: [], filters: {}, hasMore: false });

        expect(view.state.status).toBe("empty-unrecorded");
        expect(view.groups).toEqual([]);
    });

    it("reports the filtered-empty state separately", () => {
        const view = buildTimelineView({
            records: [],
            filters: { actorId: "u-9" },
            hasMore: false
        });

        expect(view.state.status).toBe("empty-filtered");
        expect(view.filtersActive).toBe(true);
    });

    describe("filter options", () => {
        it("offers each distinct actor once", () => {
            const view = buildTimelineView({
                records: [
                    record(),
                    record(),
                    record({ actor: { id: "u-2", type: "admin", displayName: "Grace" } })
                ],
                filters: {},
                hasMore: false
            });

            expect(view.actors).toEqual([
                { id: "u-1", displayName: "Ada", isMachine: false, rows: 2 },
                { id: "u-2", displayName: "Grace", isMachine: false, rows: 1 }
            ]);
        });

        it("puts the busiest actor first, because that is who the history is about", () => {
            const view = buildTimelineView({
                records: [
                    record({ actor: { id: "u-2", type: "admin", displayName: "Grace" } }),
                    record(),
                    record()
                ],
                filters: {},
                hasMore: false
            });

            expect(view.actors.map(actor => actor.displayName)).toEqual(["Ada", "Grace"]);
        });

        it("marks a writer that was not a person at a keyboard", () => {
            // The reader's question is whether a human did this, so the two are offered together
            // and told apart by their mark rather than split into separate lists.
            const view = buildTimelineView({
                records: [record({ actor: { id: "k-1", type: "api-key", displayName: "sync" } })],
                filters: {},
                hasMore: false
            });

            expect(view.actors[0]!.isMachine).toBe(true);
        });

        it("does not offer a redacted actor as a blank option", () => {
            // A reader without actor identity cannot filter by actor, and the API rejects it.
            const view = buildTimelineView({
                records: [record({ actor: { id: "", type: "", displayName: "" } })],
                filters: {},
                hasMore: false
            });

            expect(view.actors).toEqual([]);
        });

        it("offers each distinct revision once, newest first", () => {
            // By version, not by when a record arrived: the first record touching an older
            // revision can easily post-date the first one touching a newer one, and ordering by
            // arrival put "Revision 4, Revision 2, Revision 3, Revision 1" in the running admin.
            const view = buildTimelineView({
                records: [
                    record({ revision: "abc#0003" }),
                    record({ revision: "abc#0001" }),
                    record({ revision: "abc#0003" })
                ],
                filters: {},
                hasMore: false
            });

            expect(view.revisions).toEqual([
                { revision: "abc#0003", label: "Revision 3", status: null, rows: 2 },
                { revision: "abc#0001", label: "Revision 1", status: null, rows: 1 }
            ]);
        });

        it("puts a revision it cannot place a number on last", () => {
            const view = buildTimelineView({
                records: [record({ revision: "loose" }), record({ revision: "abc#0002" })],
                filters: {},
                hasMore: false
            });

            expect(view.revisions.map(option => option.revision)).toEqual(["abc#0002", "loose"]);
        });

        it("names the revision the way the header above its rows does", () => {
            // Three places name the same revision — the sticky header, this option and the
            // control that carries it once chosen. A raw id in one of them reads as a different
            // revision entirely.
            const view = buildTimelineView({
                records: [record({ revision: "abc#0002" })],
                filters: {},
                hasMore: false
            });

            expect(view.revisions[0]!.label).toBe("Revision 2");
        });

        it("carries the publishing status only for the revision whose status is known", () => {
            // Activity records say which revision a change landed on and nothing about how it is
            // published. Only the form knows, and only about the one it is showing — so anything
            // else would be a guess presented as a fact.
            const view = buildTimelineView({
                records: [record({ revision: "abc#0003" }), record({ revision: "abc#0001" })],
                filters: {},
                hasMore: false,
                currentRevision: "abc#0003",
                currentStatus: "draft"
            });

            expect(view.revisions.map(option => option.status)).toEqual(["draft", null]);
        });

        it("builds the options from the unfiltered records when it is given them", () => {
            // Filtering happens on the server, so once a revision filter is applied the records on
            // screen are only that revision's. Options built from those would offer exactly the
            // value already chosen, and the reader could not move to another revision.
            const view = buildTimelineView({
                records: [record({ revision: "abc#0003" })],
                filters: { revision: "abc#0003" },
                hasMore: false,
                catalogRecords: [record({ revision: "abc#0003" }), record({ revision: "abc#0001" })]
            });

            expect(view.revisions.map(option => option.revision)).toEqual(["abc#0003", "abc#0001"]);
        });
    });

    it("does not claim partial coverage while more pages remain", () => {
        // The creation record may be on a later page.
        const view = buildTimelineView({ records: [record()], filters: {}, hasMore: true });

        expect(view.state.coverage).toEqual({ kind: "complete" });
    });

    it("claims partial coverage once everything is loaded and no creation appears", () => {
        const view = buildTimelineView({
            records: [record({ timestamp: "2026-09-09T09:00:00.000Z" })],
            filters: {},
            hasMore: false
        });

        expect(view.state.coverage).toMatchObject({ kind: "partial" });
    });
});
