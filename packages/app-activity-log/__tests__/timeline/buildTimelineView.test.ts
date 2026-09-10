import { describe, expect, it } from "vitest";
import { buildTimelineView, hasActiveFilters } from "~/hooks/buildTimelineView.js";
import type { TimelineRecord } from "~/timeline/types.js";

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
                { id: "u-1", displayName: "Ada" },
                { id: "u-2", displayName: "Grace" }
            ]);
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
            const view = buildTimelineView({
                records: [
                    record({ revision: "abc#0003" }),
                    record({ revision: "abc#0003" }),
                    record({ revision: "abc#0001" })
                ],
                filters: {},
                hasMore: false
            });

            expect(view.revisions).toEqual(["abc#0003", "abc#0001"]);
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
