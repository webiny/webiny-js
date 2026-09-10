import { describeGroup, type DescribedGroup } from "~/timeline/describeGroup.js";
import { describeTimeline } from "~/timeline/describeTimeline.js";
import { deriveTimelineState, type TimelineState } from "~/timeline/deriveTimelineState.js";
import { groupByRevision, type TimelineGroup } from "~/timeline/groupByRevision.js";
import type { TimelineRecord } from "~/timeline/types.js";

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
    /** Distinct actors across the loaded records, for the actor filter. */
    actors: { id: string; displayName: string }[];
    /** Distinct revisions across the loaded records, newest first. */
    revisions: string[];
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
        actors: distinctActors(params.records),
        revisions: distinctRevisions(params.records)
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
const distinctActors = (records: TimelineRecord[]): { id: string; displayName: string }[] => {
    const byId = new Map<string, string>();

    for (const record of records) {
        if (record.actor.id === "") {
            continue;
        }
        if (!byId.has(record.actor.id)) {
            byId.set(record.actor.id, record.actor.displayName);
        }
    }

    return [...byId].map(([id, displayName]) => ({ id, displayName }));
};

const distinctRevisions = (records: TimelineRecord[]): string[] => {
    const seen: string[] = [];

    for (const record of records) {
        if (!seen.includes(record.revision)) {
            seen.push(record.revision);
        }
    }

    return seen;
};
