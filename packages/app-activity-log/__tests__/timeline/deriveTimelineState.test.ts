import { describe, expect, it } from "vitest";
import { deriveTimelineState } from "~/timeline/deriveTimelineState.js";
import type { TimelineRecord } from "~/timeline/types.js";

const record = (overrides: Partial<TimelineRecord> = {}): TimelineRecord => ({
    id: "rec-1",
    targetType: "cms-entry",
    targetId: "abc",
    revision: "abc#0001",
    timestamp: "2026-09-10T10:00:00.000Z",
    actor: { id: "u-1", type: "admin", displayName: "Ada" },
    action: "entry.update",
    source: "admin",
    correlationId: "corr1",
    changeset: [],
    truncated: false,
    ...overrides
});

/**
 * The two states that get skipped when building against a populated instance, and which the brief
 * makes acceptance criteria. They are different statements and must not share a message.
 */
describe("deriveTimelineState", () => {
    describe("the empty states are distinct", () => {
        it("an entry with no records at all is unrecorded, not empty", () => {
            // After an upgrade this is an entry created before the feature and never touched
            // since. "Nothing has happened yet" would be false, and "no activity" reads as loss.
            const state = deriveTimelineState({ records: [], filtersActive: false });

            expect(state.status).toBe("empty-unrecorded");
        });

        it("a filter that matches nothing is a different state entirely", () => {
            // Actionable: clear the filter. Nothing is missing.
            const state = deriveTimelineState({ records: [], filtersActive: true });

            expect(state.status).toBe("empty-filtered");
        });

        it("draws no coverage boundary when there is nothing to draw it against", () => {
            const state = deriveTimelineState({ records: [], filtersActive: false });

            expect(state.coverage).toEqual({ kind: "complete" });
        });
    });

    describe("coverage", () => {
        it("is complete when a creation record is present", () => {
            const state = deriveTimelineState({
                records: [record({ action: "entry.update" }), record({ action: "entry.create" })],
                filtersActive: false
            });

            expect(state.coverage).toEqual({ kind: "complete" });
        });

        it("is partial when there is activity but no creation record", () => {
            // The common case after an upgrade: created before the feature, edited yesterday. The
            // save shows, with a boundary saying history before it was not recorded.
            const state = deriveTimelineState({
                records: [record({ timestamp: "2026-09-09T12:00:00.000Z" })],
                filtersActive: false
            });

            expect(state.status).toBe("populated");
            expect(state.coverage).toEqual({
                kind: "partial",
                recordedFrom: "2026-09-09T12:00:00.000Z"
            });
        });

        it("reports the earliest record as the boundary, not the first in the list", () => {
            const state = deriveTimelineState({
                records: [
                    record({ timestamp: "2026-09-10T10:00:00.000Z" }),
                    record({ timestamp: "2026-09-08T09:00:00.000Z" }),
                    record({ timestamp: "2026-09-09T09:00:00.000Z" })
                ],
                filtersActive: false
            });

            expect(state.coverage).toEqual({
                kind: "partial",
                recordedFrom: "2026-09-08T09:00:00.000Z"
            });
        });

        it("claims nothing about coverage while a filter is active", () => {
            // The creation record may simply be filtered out. Asserting partial coverage here
            // would put a "not recorded" boundary on a complete history.
            const state = deriveTimelineState({
                records: [record()],
                filtersActive: true
            });

            expect(state.coverage).toEqual({ kind: "complete" });
        });

        it("claims nothing about coverage while more pages remain", () => {
            // The creation record may be on a later page.
            const state = deriveTimelineState({
                records: [record()],
                filtersActive: false,
                hasMore: true
            });

            expect(state.coverage).toEqual({ kind: "complete" });
        });
    });

    describe("the two pre-feature cases the review called out", () => {
        it("created before the feature and never touched: no history to show", () => {
            const state = deriveTimelineState({ records: [], filtersActive: false });

            expect(state).toEqual({
                status: "empty-unrecorded",
                coverage: { kind: "complete" }
            });
        });

        it("created before the feature and edited yesterday: show it, with a boundary", () => {
            const state = deriveTimelineState({
                records: [record({ timestamp: "2026-09-09T16:20:00.000Z" })],
                filtersActive: false
            });

            expect(state).toEqual({
                status: "populated",
                coverage: { kind: "partial", recordedFrom: "2026-09-09T16:20:00.000Z" }
            });
        });

        it("distinguishes them, which is the whole point", () => {
            const untouched = deriveTimelineState({ records: [], filtersActive: false });
            const edited = deriveTimelineState({ records: [record()], filtersActive: false });

            expect(untouched.status).not.toBe(edited.status);
            expect(untouched.coverage.kind).not.toBe(edited.coverage.kind);
        });
    });
});
