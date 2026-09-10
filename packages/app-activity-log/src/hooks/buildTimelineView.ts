import { deriveTimelineState, type TimelineState } from "~/timeline/deriveTimelineState.js";
import { groupByRevision, type TimelineGroup } from "~/timeline/groupByRevision.js";
import type { TimelineRecord } from "~/timeline/types.js";

export interface TimelineFilters {
    revision?: string;
    actorId?: string;
}

export interface TimelineView {
    state: TimelineState;
    groups: TimelineGroup[];
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
 * separate means the whole shaping pipeline — grouping, collapsing, state derivation, filter option
 * derivation — is testable without React, and a design handover that replaces every component
 * cannot take it with them.
 */
export const buildTimelineView = (params: {
    records: TimelineRecord[];
    filters: TimelineFilters;
    hasMore: boolean;
}): TimelineView => {
    const filtersActive = hasActiveFilters(params.filters);

    return {
        state: deriveTimelineState({
            records: params.records,
            filtersActive,
            hasMore: params.hasMore
        }),
        groups: groupByRevision(params.records),
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
