import { describeGroup, type DescribedGroup } from "~/admin/timeline/describeGroup.js";
import { describeTimeline } from "~/admin/timeline/describeTimeline.js";
import { deriveTimelineState, type TimelineState } from "~/admin/timeline/deriveTimelineState.js";
import {
    groupByRevision,
    parseVersion,
    revisionLabel,
    type TimelineGroup
} from "~/admin/timeline/groupByRevision.js";
import type { TimelineRecord } from "~/admin/timeline/types.js";

export interface TimelineFilters {
    revision?: string;
    actorId?: string;
}

/** A revision group with its header already described, so a component only arranges it. */
export interface TimelineViewGroup extends TimelineGroup {
    described: DescribedGroup;
    /**
     * True for the revision the entry form is currently showing.
     *
     * Supplied by the caller rather than derived: activity records carry the revision a change
     * landed on and nothing about which revision is current. Deriving "current" from the newest
     * record would be wrong the moment a review transition lands on an older revision.
     */
    isCurrent: boolean;
    /**
     * The revision's publishing status, when it is known.
     *
     * Only ever set for the current revision, and only because the entry form knows it. Per
     * revision status is not part of the activity data, and reconstructing it from records would
     * be a guess — a revision published before the feature existed has no publish record at all.
     */
    status: string | null;
}

export interface TimelineView {
    state: TimelineState;
    groups: TimelineViewGroup[];
    /** One line saying what the reader is looking at, and how much of it is loaded. */
    summary: string;
    /** True while a filter is narrowing the result. */
    filtersActive: boolean;
    /** The actor filter's options, most active first. */
    actors: ActorOption[];
    /** The revision filter's options, newest first. */
    revisions: RevisionOption[];
}

/** One offered revision, with what the reader needs to choose between them. */
export interface RevisionOption {
    revision: string;
    label: string;
    /**
     * The revision's publishing status, on the one revision whose status is known.
     *
     * Null everywhere else, and that is a property of the data rather than of this function: the
     * activity records say which revision a change landed on and nothing about how that revision
     * is published. Only the entry form knows, and only about the one it is showing.
     */
    status: string | null;
    /** How many rows this revision contributes, so a reader can see where the history is. */
    rows: number;
}

/** One offered actor. Machines are offered beside people, and marked as machines. */
export interface ActorOption {
    id: string;
    displayName: string;
    isMachine: boolean;
    rows: number;
}

export const hasActiveFilters = (filters: TimelineFilters): boolean => {
    return Boolean(filters.revision) || Boolean(filters.actorId);
};

/**
 * Everything between "records arrived" and "a component renders", as one pure function.
 *
 * The hook holds the loading, paging and filter *state*; this turns state into a view. Keeping it
 * separate means the whole shaping pipeline — grouping, collapsing, sentence building, state
 * derivation, filter option derivation — is testable without React, and a design pass that
 * replaces every component cannot take it with them.
 */
export const buildTimelineView = (params: {
    records: TimelineRecord[];
    filters: TimelineFilters;
    hasMore: boolean;
    /** The revision the form is showing, so its group can be marked. */
    currentRevision?: string;
    /** The current revision's publishing status, if the caller knows it. */
    currentStatus?: string | null;
    /**
     * Records to build the filter options from, when they differ from the ones on screen.
     *
     * Filtering happens on the server, so once a filter is applied `records` holds only what
     * survived it — and options derived from that offer exactly the value already chosen. The
     * revision dropdown would collapse to the revision being filtered on, leaving no way back
     * except clearing. The caller keeps the last unfiltered page for this.
     */
    catalogRecords?: TimelineRecord[];
}): TimelineView => {
    const filtersActive = hasActiveFilters(params.filters);
    const groups = groupByRevision(params.records).map(group => ({
        ...group,
        described: describeGroup(group),
        isCurrent: group.revision === params.currentRevision,
        status: group.revision === params.currentRevision ? (params.currentStatus ?? null) : null
    }));

    return {
        state: deriveTimelineState({
            records: params.records,
            filtersActive,
            hasMore: params.hasMore
        }),
        groups,
        summary: describeTimeline({ groups, filtersActive, hasMore: params.hasMore }),
        filtersActive,
        actors: actorOptions(params.catalogRecords ?? params.records),
        revisions: revisionOptions(params.catalogRecords ?? params.records, params)
    };
};

/**
 * Filter options come from the loaded records, which is a real limitation worth stating: an actor
 * who only appears on a page not yet loaded will not be offered. The alternative — a dedicated
 * endpoint enumerating every actor who ever touched the entry — is a second query against a store
 * whose read cost is already the feature's known weak point.
 *
 * Redacted actors are excluded rather than offered as a blank option: a reader without actor
 * identity cannot filter by actor at all, and the API rejects the attempt.
 */
const actorOptions = (records: TimelineRecord[]): ActorOption[] => {
    const byId = new Map<string, ActorOption>();

    for (const record of records) {
        if (record.actor.id === "") {
            continue;
        }

        const existing = byId.get(record.actor.id);

        if (existing) {
            existing.rows += 1;
            continue;
        }

        byId.set(record.actor.id, {
            id: record.actor.id,
            displayName: record.actor.displayName,
            // Everything that is not a signed-in person wrote this through a key or a job, and the
            // reader's question is which of the two — not which flavour of machine.
            isMachine: record.actor.type !== "admin",
            rows: 1
        });
    }

    // Most active first, because on an entry with a dozen contributors the useful ones are the
    // ones who did the most. Alphabetical within a tie, so the order is stable.
    return [...byId.values()].sort(
        (a, b) => b.rows - a.rows || a.displayName.localeCompare(b.displayName)
    );
};

const revisionOptions = (
    records: TimelineRecord[],
    params: { currentRevision?: string; currentStatus?: string | null }
): RevisionOption[] => {
    const byRevision = new Map<string, RevisionOption>();

    for (const record of records) {
        const existing = byRevision.get(record.revision);

        if (existing) {
            existing.rows += 1;
            continue;
        }

        byRevision.set(record.revision, {
            revision: record.revision,
            label: revisionLabel(record.revision),
            status:
                record.revision === params.currentRevision ? (params.currentStatus ?? null) : null,
            rows: 1
        });
    }

    // Newest first, by version rather than by when a record happened to arrive: a revision is
    // only "newer" in the sense the reader means — v4 above v3 — and the first record touching v3
    // can easily post-date the first one touching v4. Anything without a version sorts last,
    // because there is no number to place it by.
    return [...byRevision.values()].sort((a, b) => {
        const left = parseVersion(a.revision);
        const right = parseVersion(b.revision);

        if (left === null || right === null) {
            return left === right ? 0 : left === null ? 1 : -1;
        }

        return right - left;
    });
};
