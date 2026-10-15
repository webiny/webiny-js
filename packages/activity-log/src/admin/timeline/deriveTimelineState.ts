import type { TimelineRecord } from "./types.js";

/**
 * Whether there is anything to show, and why not when there isn't.
 *
 * Three empty-ish outcomes that are genuinely different statements, and must not be collapsed into
 * one "no activity" message:
 *
 *   - **`empty-filtered`** — records exist, the filters excluded them all. Actionable: clear the
 *     filter.
 *   - **`empty-unrecorded`** — no records at all. After an upgrade this is an entry created before
 *     the feature and never touched since. "We have no record of this entry's history" is true;
 *     "nothing has happened yet" would be a lie, and "no activity" reads as data loss.
 *   - **`populated`** — there is something to show.
 */
export type TimelineStatus = "empty-filtered" | "empty-unrecorded" | "populated";

/**
 * Whether the timeline covers the entry's whole life, and from when if not.
 *
 * The discriminator is the presence of an `entry.create` record, not a date comparison. If the
 * entry was created while the feature was recording, capture wrote a create record; if there is
 * none, the entry predates recording (or capture was not running) and everything before the
 * earliest record we hold is simply unknown.
 *
 * A date comparison against the entry's `createdOn` cannot tell those apart, which is the whole
 * problem: an entry created before the feature and edited yesterday, and one created before the
 * feature and never touched, both have a `createdOn` earlier than their first record. The first
 * needs "history before this point was not recorded" *alongside* yesterday's save; the second
 * needs "we have no record of this entry's history" instead of a timeline. Those are different
 * screens, and after an upgrade the first is the common one.
 */
export type TimelineCoverage =
    | { kind: "complete" }
    /** History before `recordedFrom` was never recorded. */
    | { kind: "partial"; recordedFrom: string };

export interface TimelineState {
    status: TimelineStatus;
    coverage: TimelineCoverage;
}

export interface DeriveTimelineStateParams {
    records: TimelineRecord[];
    /** True when a revision or actor filter is narrowing the result. */
    filtersActive: boolean;
    /** True while more pages remain, so coverage cannot yet be judged. */
    hasMore?: boolean;
}

const CREATION_ACTIONS = new Set(["entry.create"]);

export const deriveTimelineState = ({
    records,
    filtersActive,
    hasMore = false
}: DeriveTimelineStateParams): TimelineState => {
    if (records.length === 0) {
        return {
            status: filtersActive ? "empty-filtered" : "empty-unrecorded",
            // With nothing to show there is no boundary to draw. Claiming "partial" here would
            // put a "history before X was not recorded" marker on a screen with no X.
            coverage: { kind: "complete" }
        };
    }

    return {
        status: "populated",
        coverage: deriveCoverage(records, filtersActive, hasMore)
    };
};

const deriveCoverage = (
    records: TimelineRecord[],
    filtersActive: boolean,
    hasMore: boolean
): TimelineCoverage => {
    // A filtered view is not evidence about coverage: the create record may simply be filtered
    // out. Same for a partially-loaded timeline — the create record may be on a later page. In
    // both cases claiming partial coverage would be asserting something unknown.
    if (filtersActive || hasMore) {
        return { kind: "complete" };
    }

    if (records.some(record => CREATION_ACTIONS.has(record.action))) {
        return { kind: "complete" };
    }

    return { kind: "partial", recordedFrom: earliestTimestamp(records) };
};

const earliestTimestamp = (records: TimelineRecord[]): string => {
    return records.reduce(
        (earliest, record) => (record.timestamp < earliest ? record.timestamp : earliest),
        records[0]!.timestamp
    );
};
