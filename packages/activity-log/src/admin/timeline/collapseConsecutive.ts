import type { TimelineChange, TimelineRecord } from "./types.js";

/**
 * One row on the timeline. Either a single record, or several consecutive ones merged.
 */
export interface TimelineItem {
    /** The most recent record in the item, whose timestamp the row is ordered by. */
    latest: TimelineRecord;
    /** Every record the row represents, newest first. One entry when nothing was merged. */
    records: TimelineRecord[];
    /** The union of the merged records' changed paths, deduplicated. */
    changeset: TimelineChange[];
    /** True when any merged record was truncated. */
    truncated: boolean;
    /** Oldest timestamp in the item, equal to `latest.timestamp` when nothing was merged. */
    earliestTimestamp: string;
}

/**
 * Only saves collapse.
 *
 * A run of saves by one person is one editing session as far as a reader is concerned, and showing
 * eleven rows for it buries everything else. But collapsing anything *else* destroys information:
 * two publishes in a row are two publishes, and a publish followed by an unpublish is a story.
 * Merging distinct actions, or the same action by different people, would make the timeline
 * shorter and wrong.
 */
const COLLAPSIBLE_ACTIONS = new Set(["entry.update"]);

export interface CollapseOptions {
    /**
     * Records further apart than this are not merged even when otherwise identical, because a save
     * now and a save tomorrow are not one session. Defaults to an hour.
     */
    maxGapMs?: number;
}

const DEFAULT_MAX_GAP_MS = 60 * 60 * 1000;

/**
 * Merges consecutive same-actor saves into one row, newest first.
 *
 * Expects records newest-first, which is the order the API returns.
 */
export const collapseConsecutive = (
    records: TimelineRecord[],
    options: CollapseOptions = {}
): TimelineItem[] => {
    const maxGapMs = options.maxGapMs ?? DEFAULT_MAX_GAP_MS;
    const items: TimelineItem[] = [];

    for (const record of records) {
        const open = items[items.length - 1];

        if (open && mergeable(open, record, maxGapMs)) {
            open.records.push(record);
            open.changeset = mergeChangesets(open.changeset, record.changeset);
            open.truncated = open.truncated || record.truncated;
            open.earliestTimestamp = record.timestamp;
            continue;
        }

        items.push({
            latest: record,
            records: [record],
            changeset: dedupe(record.changeset),
            truncated: record.truncated,
            earliestTimestamp: record.timestamp
        });
    }

    return items;
};

const mergeable = (item: TimelineItem, record: TimelineRecord, maxGapMs: number): boolean => {
    const previous = item.records[item.records.length - 1]!;

    if (!COLLAPSIBLE_ACTIONS.has(record.action) || record.action !== previous.action) {
        return false;
    }

    // A redacted actor has an empty id. Merging two redacted records would assert they were the
    // same person, which is exactly what the reader is not allowed to know.
    if (record.actor.id === "" || previous.actor.id === "") {
        return false;
    }

    if (record.actor.id !== previous.actor.id) {
        return false;
    }

    // Saves against different revisions stay separate: the revision is what the reader is
    // orienting by, and grouping runs by revision anyway.
    if (record.revision !== previous.revision) {
        return false;
    }

    return withinGap(previous.timestamp, record.timestamp, maxGapMs);
};

const withinGap = (newer: string, older: string, maxGapMs: number): boolean => {
    const newerMs = Date.parse(newer);
    const olderMs = Date.parse(older);

    if (Number.isNaN(newerMs) || Number.isNaN(olderMs)) {
        // An unparseable timestamp is not evidence that two records belong together.
        return false;
    }

    return newerMs - olderMs <= maxGapMs;
};

const key = (change: TimelineChange): string => `${change.path}::${change.operation ?? ""}`;

const dedupe = (changes: TimelineChange[]): TimelineChange[] => {
    const seen = new Set<string>();

    return changes.filter(change => {
        const id = key(change);
        if (seen.has(id)) {
            return false;
        }
        seen.add(id);
        return true;
    });
};

/**
 * The union of two changesets, keeping the first-seen label.
 *
 * First-seen means the newest, because records arrive newest first — and the newest label is the
 * one closest to how the model reads now, which is the more useful of the two when a field was
 * renamed between saves.
 */
const mergeChangesets = (
    existing: TimelineChange[],
    incoming: TimelineChange[]
): TimelineChange[] => {
    return dedupe([...existing, ...incoming]);
};
