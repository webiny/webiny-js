import { collapseConsecutive, type TimelineItem } from "./collapseConsecutive.js";
import { describeAction } from "./describeAction.js";
import { describeChangeset, type DescribedChange } from "./describeChange.js";
import { isRedactedActor, type TimelineRecord } from "./types.js";

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
    /**
     * The generated sentence for this row, when exactly one covers the whole of it.
     *
     * Null when the row carries none, which is the overwhelming majority — and also when it
     * carries several, because a row collapses on a far wider window than a summary is debounced
     * on. An hour of editing can hold two or three summarised runs, and putting one of them on a
     * closed row would attribute a sentence to saves it never saw. The expansion shows all of them
     * instead.
     *
     * Null is not a failure signal and must never be rendered as one. A record that never
     * qualified, one whose job failed, one the sweeper reclaimed and one whose summary this reader
     * may not see all arrive here identically, deliberately: the row has its deterministic
     * description either way, and there is nothing for a reader to do about any of them.
     */
    summary: string | null;
    /**
     * True while any save in the row is still waiting for its summary.
     *
     * The only summary state a reader is shown, and the only one worth showing: it is the single
     * case where something really is coming, and a row that looked settled would be wrong about it
     * for a minute.
     */
    summaryPending: boolean;
}

/** The summaries a row carries, newest first. Usually none, sometimes one, rarely more. */
const summariesOf = (item: TimelineItem): string[] => {
    return item.records
        .map(record => record.summary)
        .filter((summary): summary is string => typeof summary === "string" && summary !== "");
};

/**
 * What a collapsed row states before anyone expands it.
 *
 * Deliberately excludes the changed fields. A row says how much changed, not what — the list is
 * what expanding is for. A closed row that already named every field would make expanding
 * pointless and the timeline unreadable at a glance.
 *
 * The summary is the one exception and it earns it: it is a sentence rather than a list, and it
 * says what the run was about in the place a reader is already looking.
 */
export const summariseItem = (item: TimelineItem): ItemSummary => {
    const { latest } = item;
    const summaries = summariesOf(item);

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
        truncated: item.truncated,
        summary: summaries.length === 1 ? summaries[0]! : null,
        summaryPending: item.records.some(record => record.summaryPending === true)
    };
};

/** One save inside an expanded row, described on its own terms. */
export interface DisclosedSave {
    /** The record's id, which is also the list key. */
    id: string;
    timestamp: string;
    /**
     * The deterministic sentence for this save alone.
     *
     * Per save rather than per row, because the row's own sentence describes the run — "made 4
     * saves, editing 6 fields" — and a reader who opened it is asking what each of those four was.
     */
    sentence: string;
    changes: DescribedChange[];
    truncated: boolean;
}

export interface ItemDisclosure {
    /**
     * The row's summaries, newest first, shown above the saves.
     *
     * Above rather than against any particular save. The client is told which records carry a
     * summary, never which saves a summary covered: a run's values are joined server-side and that
     * mapping does not cross the API, so pinning a sentence to individual rows here would be a
     * guess presented as a fact.
     */
    summaries: string[];
    /** Every save the row stands for, newest first. */
    saves: DisclosedSave[];
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
     * Whether the changeset carries values. Always false, and stated rather than implied.
     *
     * The changeset records which fields changed and never what they became, so an expanded save
     * has to say so or read as though the values failed to load. Note the scope, which the copy
     * has to keep straight: a *summary* is prose about the change and may quote a fragment of it.
     * The two are different things and only one of them is a record of values.
     */
    valuesAvailable: false;
}

/** One record, shaped the way a row is, so the same describer can read it. */
const asItem = (record: TimelineRecord): TimelineItem => collapseConsecutive([record])[0]!;

/**
 * What an expanded row discloses.
 *
 * The whole disclosure decision is here rather than in a component, because it is the question the
 * feature's privacy properties turn on. Paths and labels, yes. Counts, yes. Truncation, said out
 * loud. Changeset values, never — and the absence is a declared field rather than something a
 * reader has to infer from an empty space.
 */
export const discloseItem = (item: TimelineItem): ItemDisclosure => {
    return {
        summaries: summariesOf(item),
        saves: item.records.map(record => ({
            id: record.id,
            timestamp: record.timestamp,
            sentence: describeAction(asItem(record)).sentence,
            changes: describeChangeset(record.changeset),
            truncated: record.truncated
        })),
        truncated: item.truncated,
        valuesAvailable: false
    };
};
