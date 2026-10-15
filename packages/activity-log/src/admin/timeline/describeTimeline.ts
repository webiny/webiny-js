import type { TimelineGroup } from "./groupByRevision.js";

export interface DescribeTimelineParams {
    groups: TimelineGroup[];
    filtersActive: boolean;
    /** True when older activity remains unloaded, which changes what the counts can claim. */
    hasMore: boolean;
}

/**
 * The line above the timeline that says what the reader is looking at.
 *
 * Its whole job is to keep the counts honest. Only part of the history is loaded at any time, so
 * "31 saves" would be a claim the panel cannot support — it says "31 loaded" instead, and only
 * drops the qualifier once everything is in. Under a filter it counts matches rather than the
 * whole, because a reader who has narrowed the timeline is asking a different question.
 *
 * "Kept permanently" is stated rather than assumed: retention is a property of the feature a
 * reader has no other way to learn, and it is the reason a long timeline is expected rather than a
 * sign something has gone wrong.
 */
export const describeTimeline = (params: DescribeTimelineParams): string => {
    const { groups, filtersActive, hasMore } = params;

    const saves = groups.reduce(
        (total, group) =>
            total + group.items.reduce((count, item) => count + item.records.length, 0),
        0
    );

    if (saves === 0) {
        return filtersActive ? "No activity matches these filters" : "";
    }

    const savesText = `${saves} ${saves === 1 ? "save" : "saves"}`;
    const revisionsText = `${groups.length} ${groups.length === 1 ? "revision" : "revisions"}`;

    if (filtersActive) {
        return `${savesText} across ${revisionsText} match`;
    }

    if (hasMore) {
        return `${savesText} across ${revisionsText} loaded · older activity available`;
    }

    return `${savesText} across ${revisionsText} · kept permanently`;
};
