import type { TimelineItem } from "./collapseConsecutive.js";
import { describeChangeset, type DescribedChange } from "./describeChange.js";
import { isRedactedActor } from "./types.js";

export interface ItemSummary {
    action: string;
    /** How many records the row stands for. One unless saves were collapsed. */
    occurrences: number;
    actorDisplayName: string | null;
    /** True when the reader may not see who did this. */
    actorRedacted: boolean;
    latestTimestamp: string;
    earliestTimestamp: string;
    /** True when the row covers a span rather than an instant. */
    spansTime: boolean;
    source: string;
    correlationId: string;
    /** Present for a review transition: which step it concerned. */
    subjectLabel: string | null;
    /** True when a review decision carried a note. The note itself is never available. */
    hasNote: boolean;
    changedFieldCount: number;
    truncated: boolean;
}

/**
 * What a collapsed row states before anyone expands it.
 *
 * Deliberately excludes the changed fields. A row says how much changed, not what — the list is
 * what expanding is for. A closed row that already named every field would make expanding
 * pointless and the timeline unreadable at a glance.
 */
export const summariseItem = (item: TimelineItem): ItemSummary => {
    const { latest } = item;

    return {
        action: latest.action,
        occurrences: item.records.length,
        actorDisplayName: isRedactedActor(latest.actor) ? null : latest.actor.displayName,
        actorRedacted: isRedactedActor(latest.actor),
        latestTimestamp: latest.timestamp,
        earliestTimestamp: item.earliestTimestamp,
        spansTime: item.earliestTimestamp !== latest.timestamp,
        source: latest.source,
        correlationId: latest.correlationId,
        subjectLabel: latest.subject?.label ?? null,
        hasNote: latest.hasNote === true,
        changedFieldCount: item.changeset.length,
        truncated: item.truncated
    };
};

export interface ItemDisclosure {
    changes: DescribedChange[];
    /**
     * True when more changed than is listed, because the changeset hit its cap and the remainder
     * were rolled up to a common parent.
     *
     * Surfaced explicitly so the UI can say so. A truncated list rendered as though complete is
     * the one outcome worse than no list: a reader would conclude the unlisted fields did not
     * change.
     */
    truncated: boolean;
    /**
     * Whether values are available. Always false, and stated rather than implied.
     *
     * The feature records no content values by design, so an expanded save can say which fields
     * changed and never what they became. The UI is expected to point at version compare, which is
     * where values legitimately live.
     */
    valuesAvailable: false;
}

/**
 * What an expanded row discloses.
 *
 * The whole disclosure decision is here rather than in a component, because it is the question the
 * feature's privacy properties turn on. Paths and labels, yes. Counts, yes. Truncation, said out
 * loud. Values, never — and the absence is a declared field rather than something a reader has to
 * infer from an empty space.
 */
export const discloseItem = (item: TimelineItem): ItemDisclosure => {
    return {
        changes: describeChangeset(item.changeset),
        truncated: item.truncated,
        valuesAvailable: false
    };
};
