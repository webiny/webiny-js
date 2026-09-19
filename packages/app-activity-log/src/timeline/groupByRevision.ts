import {
    collapseConsecutive,
    type CollapseOptions,
    type TimelineItem
} from "./collapseConsecutive.js";
import type { TimelineRecord } from "./types.js";

export interface TimelineGroup {
    /** The revision id, including its suffix. */
    revision: string;
    /** Version number parsed from the revision, when it has one. */
    version: number | null;
    items: TimelineItem[];
    /** Newest activity in the group, which is what the group is ordered by. */
    latestTimestamp: string;
    earliestTimestamp: string;
}

/**
 * Groups activity under the revision it happened on, newest revision first.
 *
 * Revision is the axis a reader orients by — the brief's whole reason for recording per save
 * rather than per revision is that one revision holds many saves by several people over days. The
 * grouping is what makes that legible instead of a flat wall of saves.
 *
 * Groups are ordered by their newest activity, not by version number. Usually the two agree, but
 * not always: a review transition can land on an older revision after work has started on a newer
 * one, and ordering by version would then put stale activity above fresh activity.
 */
export const groupByRevision = (
    records: TimelineRecord[],
    options: CollapseOptions = {}
): TimelineGroup[] => {
    const byRevision = new Map<string, TimelineRecord[]>();

    for (const record of records) {
        const bucket = byRevision.get(record.revision);

        if (bucket) {
            bucket.push(record);
        } else {
            byRevision.set(record.revision, [record]);
        }
    }

    const groups: TimelineGroup[] = [];

    for (const [revision, bucket] of byRevision) {
        const ordered = [...bucket].sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));

        groups.push({
            revision,
            version: parseVersion(revision),
            items: collapseConsecutive(ordered, options),
            latestTimestamp: ordered[0]!.timestamp,
            earliestTimestamp: ordered[ordered.length - 1]!.timestamp
        });
    }

    return groups.sort((a, b) => (a.latestTimestamp < b.latestTimestamp ? 1 : -1));
};

/**
 * The version from a revision id such as `abc#0004`.
 *
 * Returns null rather than guessing when the id is not in that shape — a caller rendering "v4"
 * should show nothing rather than "vNaN".
 */
export const parseVersion = (revision: string): number | null => {
    const match = revision.match(/#(\d+)$/);

    if (!match) {
        return null;
    }

    const version = Number.parseInt(match[1]!, 10);

    return Number.isFinite(version) ? version : null;
};
