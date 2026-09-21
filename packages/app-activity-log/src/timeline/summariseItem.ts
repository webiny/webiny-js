import { collapseConsecutive, type TimelineItem } from "./collapseConsecutive.js";
import { describeAction } from "./describeAction.js";
import { describeChangeset, type DescribedChange } from "./describeChange.js";
import { isRedactedActor, type TimelineRecord } from "./types.js";

/** One summary, with how it was produced — which decides whether the row marks it. */
export interface TimelineSummary {
    text: string;
    /** True when a model wrote it. False for one rendered from the recorded values. */
    generated: boolean;
}

/** One save inside an expanded row, described on its own terms. */
export interface DisclosedSave {
    /** The record's id, which is also the list key. */
    id: string;
    timestamp: string;
    /**
     * The field-name description for this save alone.
     *
     * Per save rather than per row, because the row's own description covers the whole run — "made
     * 4 saves, editing 6 fields" — and a reader who opened it is asking what each of those four was.
     *
     * Always present, whatever happened to the sentences above it. It is what the timeline showed
     * before summaries existed and what every failure, refusal and suppression falls back to, which
     * is why no state in this timeline reads as broken.
     */
    sentence: string;
    changes: DescribedChange[];
    truncated: boolean;
}

/**
 * A run of saves, which is what a summary describes.
 *
 * The debounce joins consecutive saves by one person to one revision inside a minute, and the job
 * writes a single sentence covering all of them. Rows collapse on an hour, so one row routinely
 * holds several runs — which is why membership is read from the record rather than inferred from
 * position.
 */
export interface DisclosedRun {
    /** The run's id, which is also its list key. */
    id: string;
    /**
     * The sentence covering this run, to be shown inside the expansion.
     *
     * Null when the run has none, and also when the collapsed row is already showing this one — a
     * row that maps onto a single run puts that run's sentence in its header, and the expansion
     * repeating it underneath is the duplication this shape exists to remove.
     */
    summary: TimelineSummary | null;
    /** True while this run's job is still in flight. */
    pending: boolean;
    /**
     * Whether the run needs a wrapper of its own.
     *
     * A sentence covering several saves has to be visibly attached to all of them. A run of one has
     * nothing to bind together, so it renders as a save and is given no weight suggesting
     * otherwise. Decided here rather than by a component counting saves.
     */
    grouped: boolean;
    /** The saves this run covers, newest first. */
    saves: DisclosedSave[];
}

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
     * The sentence for this row, when the row maps onto exactly one run.
     *
     * Null when the row holds several, and that is the same judgement as refusing to name a field
     * on a truncated changeset rather than a rule of its own. In both cases the row stands for more
     * than the thing on offer, and offering it anyway attributes a statement to saves it was never
     * about — which a reader would act on.
     *
     * Null is not a failure signal and must never be rendered as one. A row whose runs produced no
     * sentence, one whose job failed, one the sweeper reclaimed, one whose sentence this reader may
     * not see, and one that simply holds two runs all arrive here identically. Every one of them
     * still has its field-name description, which is what the timeline showed before summaries
     * existed.
     */
    summary: TimelineSummary | null;
    /**
     * True while this row is waiting for a sentence it does not yet have.
     *
     * Never set beside one it already has. A row showing a settled sentence with "Summarising…"
     * beneath it reads as though that sentence is the one being worked on — a different claim, and
     * a wrong one, because the run still in flight is a different run.
     */
    summaryPending: boolean;
}

const summaryOf = (record: TimelineRecord): TimelineSummary | null => {
    if (typeof record.summary !== "string" || record.summary === "") {
        return null;
    }

    return {
        text: record.summary,
        // Only a model's prose is marked. A rendered summary restates recorded values, which is
        // what every other line on this timeline does, so marking it would say nothing.
        generated: record.summaryKind === "ai"
    };
};

/** Which run a record belongs to. A record that joined none is its own run. */
const runIdOf = (record: TimelineRecord): string => record.summaryRunId ?? record.id;

/** One record, shaped the way a row is, so the same describer can read it. */
const asItem = (record: TimelineRecord): TimelineItem => collapseConsecutive([record])[0]!;

interface RunMembers {
    id: string;
    records: TimelineRecord[];
}

/**
 * The runs a row holds, newest first, grouped by the id each record carries.
 *
 * By membership rather than by adjacency, which is the whole point: a row collapses on an hour and
 * a run debounces on a minute, so position says nothing about which sentence covers which save.
 */
const runsOf = (item: TimelineItem): RunMembers[] => {
    const order: string[] = [];
    const members = new Map<string, TimelineRecord[]>();

    for (const record of item.records) {
        const id = runIdOf(record);

        if (!members.has(id)) {
            members.set(id, []);
            order.push(id);
        }

        members.get(id)!.push(record);
    }

    return order.map(id => ({ id, records: members.get(id)! }));
};

/**
 * The run's sentence, which lives on the record that opened the run.
 *
 * Taken from whichever member carries one rather than from the record whose id matches: a save by
 * someone else in the middle of a run splits the row, and a run whose opening record is not in this
 * row shows no sentence here rather than borrowing another run's.
 */
const sentenceFor = (run: RunMembers): TimelineSummary | null =>
    run.records.map(summaryOf).find(found => found !== null) ?? null;

/**
 * What a collapsed row states before anyone expands it.
 *
 * Deliberately excludes the changed fields. A row says how much changed, not what — the list is
 * what expanding is for. A closed row that already named every field would make expanding pointless
 * and the timeline unreadable at a glance.
 *
 * The sentence is the one exception and it earns it: it is a sentence rather than a list, and it
 * says what the run was about in the place a reader is already looking.
 */
export const summariseItem = (item: TimelineItem): ItemSummary => {
    const { latest } = item;
    const runs = runsOf(item);

    // One run, one sentence, and no question about what it covers.
    const summary = runs.length === 1 ? sentenceFor(runs[0]!) : null;

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
        summary,
        summaryPending:
            summary === null && item.records.some(record => record.summaryPending === true)
    };
};

export interface ItemDisclosure {
    /** The runs this row holds, newest first, each with the saves it covers. */
    runs: DisclosedRun[];
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
     * has to say so or read as though the values failed to load.
     */
    valuesAvailable: false;
    /**
     * Whether a sentence is on screen anywhere for this row.
     *
     * Here rather than in the component because it decides what the row may truthfully say about
     * itself. The change list and a sentence sit at different disclosure levels — the list records
     * field names and never values, a sentence is written from the values and may quote them — and
     * one line covering both is what made the previous footer false.
     *
     * True whether the sentence is in the row's header or inside the expansion: both are on screen
     * at the moment the footer is read.
     */
    hasSentence: boolean;
}

/**
 * What an expanded row discloses.
 *
 * The whole disclosure decision is here rather than in a component, because it is the question the
 * feature's privacy properties turn on. Paths and labels, yes. Counts, yes. Truncation, said out
 * loud. Changeset values, never — and the absence is a declared field rather than something a
 * reader has to infer from an empty space.
 */
export const discloseItem = (item: TimelineItem): ItemDisclosure => {
    const runs = runsOf(item);
    // The row shows its own sentence in the header when it maps onto a single run, and that header
    // is on screen whether the row is open or closed.
    const carriedByRow = runs.length === 1 && sentenceFor(runs[0]!) !== null;

    return {
        hasSentence: runs.some(run => sentenceFor(run) !== null),
        runs: runs.map(run => {
            const summary = sentenceFor(run);

            return {
                id: run.id,
                summary: carriedByRow ? null : summary,
                pending: run.records.some(record => record.summaryPending === true),
                grouped: run.records.length > 1 && summary !== null,
                saves: run.records.map(record => ({
                    id: record.id,
                    timestamp: record.timestamp,
                    sentence: describeAction(asItem(record)).sentence,
                    changes: describeChangeset(record.changeset),
                    truncated: record.truncated
                }))
            };
        }),
        truncated: item.truncated,
        valuesAvailable: false
    };
};
