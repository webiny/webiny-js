import { collapseConsecutive, type TimelineItem } from "./collapseConsecutive.js";
import { describeAction } from "./describeAction.js";
import { describeChangeset, elideAncestors, type DescribedChange } from "./describeChange.js";
import { formatNameList } from "./describeGroup.js";
import { isRedactedActor, type TimelineRecord } from "./types.js";

/**
 * How a sentence came to exist, which is what a reader needs in order to know whether to trust it.
 *
 * Three kinds, and the difference is not decoration. `generated` is a model's reading of the
 * change and can be wrong. `deterministic` is built from the recorded values and is exact.
 * `fields` names the fields and quotes nothing — it is what the timeline showed before summaries
 * existed, and what every failure, refusal and suppression falls back to.
 */
export type SentenceKind = "generated" | "deterministic" | "fields";

/** One sentence, with how it came to exist. */
export interface TimelineSentence {
    text: string;
    kind: SentenceKind;
    /**
     * True only for a model's prose.
     *
     * Kept beside the kind because it is the one distinction the interface marks, and a component
     * asking "does this get the mark" should not have to know which kinds exist.
     */
    generated: boolean;
}

/**
 * The changed fields of one save that share a containing path.
 *
 * Grouped rather than listed flat because a path repeated once per field is the bulk of what made
 * the previous layout read as a form: four fields under the same variant stated that variant four
 * times. Said once above the fields that share it, it is orientation instead of noise.
 */
export interface DisclosedFieldGroup {
    /** Containing fields, outermost first. Empty for a field at the root. */
    path: string[];
    /** The path as one line, middle elided past two levels. Empty when there is no path. */
    pathLabel: string;
    /** The whole path, unelided, for a tooltip. */
    fullPath: string;
    /** How deep the change was, stated only where the label elides something. */
    depth: string;
    fields: DescribedChange[];
}

/** One save inside an expanded row, described on its own terms. */
export interface DisclosedSave {
    /** The record's id, which is also the list key. */
    id: string;
    timestamp: string;
    changes: DescribedChange[];
    /**
     * The same changes, gathered under the paths they share.
     *
     * What the expansion renders. `changes` stays because it is the flat truth of what the save
     * touched, and because nothing that reads it should have to understand the grouping.
     */
    groups: DisclosedFieldGroup[];
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
     * Always present except while the run is pending, because a run with no stored summary still
     * has its field-name description — the third kind. All three occupy the same slot at the same
     * indent, so the mark beside a generated one is the only thing that varies, and an exact record
     * carries no decoration at all.
     *
     * Null when the collapsed row is already showing this one: a row that maps onto a single run
     * puts that run's sentence in its header, and the expansion repeating it underneath is the
     * duplication this shape exists to remove.
     */
    summary: TimelineSentence | null;
    /** True while this run's job is still in flight. */
    pending: boolean;
    /**
     * Whether each save needs its own clock.
     *
     * A run of one save happened at the run's time, so stating it twice is noise. A run of several
     * needs them, because the saves are the only thing distinguishing one moment from the next.
     */
    showSaveTimes: boolean;
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
    /**
     * The fields this row touched, as one phrase, for a row with no sentence to show instead.
     *
     * Bounded by the same rule the rest of the feature uses for lists of names — three, then a
     * count — because a row that touched thirty fields would otherwise put thirty names on a line
     * that exists to be glanced at.
     */
    fieldsLine: string;
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
    summary: TimelineSentence | null;
    /**
     * True while this row is waiting for a sentence it does not yet have.
     *
     * Never set beside one it already has. A row showing a settled sentence with "Summarising…"
     * beneath it reads as though that sentence is the one being worked on — a different claim, and
     * a wrong one, because the run still in flight is a different run.
     */
    summaryPending: boolean;
}

const summaryOf = (record: TimelineRecord): TimelineSentence | null => {
    if (typeof record.summary !== "string" || record.summary === "") {
        return null;
    }

    const generated = record.summaryKind === "ai";

    return {
        text: record.summary,
        kind: generated ? "generated" : "deterministic",
        // Only a model's prose is marked. A sentence built from the recorded values restates what
        // was recorded, which is what every other line on this timeline does, so marking it would
        // say nothing.
        generated
    };
};

/**
 * A save's changes, gathered under the paths they share, in the order the paths first appear.
 *
 * Order matters and is taken from the changeset rather than sorted: the changeset is already in the
 * order the differ walked the entry, which is the order a reader sees the fields in the form.
 */
const groupByPath = (changes: DescribedChange[]): DisclosedFieldGroup[] => {
    const order: string[] = [];
    const groups = new Map<string, DescribedChange[]>();

    for (const change of changes) {
        const key = change.ancestors.join("\u0001");

        if (!groups.has(key)) {
            groups.set(key, []);
            order.push(key);
        }

        groups.get(key)!.push(change);
    }

    return order.map(key => {
        const fields = groups.get(key)!;
        const path = fields[0]!.ancestors;

        return {
            path,
            pathLabel: elideAncestors(path),
            fullPath: path.join(" › "),
            // Stated only where the label elides something, so a reader never has to wonder
            // whether the shortened form is hiding a level.
            depth: path.length > 2 ? `${path.length} levels` : "",
            fields
        };
    });
};

/** Which run a record belongs to. A record that joined none is its own run. */
const runIdOf = (record: TimelineRecord): string => record.summaryRunId ?? record.id;

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
 * The run's stored sentence, which lives on the record that opened the run.
 *
 * Taken from whichever member carries one rather than from the record whose id matches: a save by
 * someone else in the middle of a run splits the row, and a run whose opening record is not in this
 * row shows no sentence here rather than borrowing another run's.
 */
const sentenceFor = (run: RunMembers): TimelineSentence | null =>
    run.records.map(summaryOf).find(found => found !== null) ?? null;

/**
 * The run's sentence, falling back to naming the fields it touched.
 *
 * The third kind, and it is not a placeholder: it is what the timeline said before summaries
 * existed, and it is what a reader gets when a summary was never written, failed, was reclaimed or
 * is not theirs to see. Deriving it here rather than leaving the slot empty is what stops any of
 * those four looking like a fault.
 */
const describedRun = (run: RunMembers): TimelineSentence => {
    const stored = sentenceFor(run);

    if (stored) {
        return stored;
    }

    return {
        text: describeAction(collapseConsecutive(run.records)[0]!).sentence,
        kind: "fields",
        generated: false
    };
};

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
        fieldsLine: formatNameList(describeChangeset(item.changeset).map(change => change.label)),
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

    // A row that maps onto a single run *is* that run's heading, and the header stays on screen
    // when the row opens. So the expansion repeats none of it — not the sentence, and not the
    // pending note either, which is the same rule and not a second one. Where a row holds several
    // runs the header can only speak for the row, and each run states its own.
    const soleRun = runs.length === 1;

    return {
        hasSentence: runs.some(run => sentenceFor(run) !== null),
        runs: runs.map(run => {
            const pending = run.records.some(record => record.summaryPending === true);
            const summary = describedRun(run);

            return {
                id: run.id,
                // A pending run shows no sentence: the placeholder occupies the slot the sentence
                // will take, so nothing moves sideways when it resolves. Falling back to naming the
                // fields here would put a sentence beside the thing saying a sentence is coming.
                summary: soleRun || pending ? null : summary,
                pending: soleRun ? false : pending,
                showSaveTimes: run.records.length > 1,
                // No wrapper for a sole run: there is nothing in the expansion to distinguish its
                // saves from, and a box around all of them would suggest a grouping that carries
                // no information. A run whose only sentence names its fields has nothing to bind
                // together either — that sentence is a restatement of the chips beneath it.
                grouped: !soleRun && run.records.length > 1 && summary.kind !== "fields",
                saves: run.records.map(record => {
                    const changes = describeChangeset(record.changeset);

                    return {
                        id: record.id,
                        timestamp: record.timestamp,
                        changes,
                        groups: groupByPath(changes),
                        truncated: record.truncated
                    };
                })
            };
        }),
        truncated: item.truncated,
        valuesAvailable: false
    };
};
