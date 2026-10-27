import { createAbstraction } from "@webiny/feature/api";

/**
 * Every number the summary path turns on, in one place.
 *
 * All first guesses. Real content will move them, which is why they are configuration rather than
 * constants — and why the reason each save was skipped is recorded, so the numbers can be judged
 * against what actually happened rather than argued about.
 */
export interface IActivitySummaryConfig {
    /** Off switches summaries off entirely: no jobs, no values stored, descriptions unaffected. */
    enabled: boolean;
    /**
     * Above this many changed paths, prose adds nothing over a count.
     *
     * Deliberately *not* the changeset roll-up cap. That one governs how many entries survive
     * before collapsing to a common parent; this one governs when a sentence stops beating a list.
     * Two questions, two constants, and they will move independently.
     */
    maxPaths: number;
    /**
     * A `text` value at or above this length is prose worth summarising; below it, the field name
     * already says everything.
     *
     * 200 rather than something lower because the failure modes are asymmetric in an unobvious
     * direction. A job that should have fired and did not costs one save its sentence, and the
     * deterministic description still reads correctly, so nothing looks broken. A job that fires
     * needlessly costs a model call and returns a sentence no better than the description — and
     * short text fields dominate real models, so a low threshold means the common case fires
     * constantly. There is no rate limiting or token accounting anywhere in AI Powerups to absorb
     * that. Lowering this later changes a constant; raising it means explaining a bill.
     *
     * Measured on the *longer* of before and after, so a paragraph deleted down to nothing still
     * counts as prose having changed.
     */
    freeTextMinLength: number;
    /**
     * How many free-text paths make a save worth a sentence on their own.
     *
     * Two or more prose fields changing is a reworked section, which a list of field names does not
     * convey.
     */
    minFreeTextPaths: number;
    /**
     * When exactly one free-text path changed, how many total changed paths it takes to qualify.
     *
     * Requiring two prose fields outright treats one substantial rewrite surrounded by a scatter of
     * small edits as uninteresting, and that is precisely the save the feature exists for — a body
     * rewritten while three headings were retouched. One prose field alone is described well enough
     * by naming it; one prose field amid a busy save is not.
     */
    singleFreeTextMinPaths: number;
    /** Serialised bundle ceiling in bytes. Above it, no job and nothing stored. */
    maxValueBytes: number;
    /** How long a run stays open for further saves to join. */
    debounceWindowMs: number;
    /** How long the job waits before running, so a run has time to accumulate. */
    dispatchDelaySeconds: number;
    /**
     * Values no longer than this are quoted verbatim in a mechanical summary; longer ones are
     * characterised instead.
     *
     * The line between "changed On sale from Yes to No", which saves a reader the trip to version
     * compare, and a timeline row carrying a paragraph — which makes the timeline unreadable and,
     * because records are kept, keeps the paragraph forever.
     */
    quotedValueMaxLength: number;
    /**
     * How many fields a mechanical summary names before it counts the remainder.
     *
     * The same instruction the model is given: describe the largest changes and say that other
     * fields also changed. A sentence naming thirty fields is the list it was meant to replace.
     */
    maxNamedFields: number;
    /**
     * How long a record may tell a reader that a summary is coming.
     *
     * The realistic wait is the dispatch delay plus a job run — a minute or so. This is the point
     * at which the claim stops being made rather than a deadline the job is held to: a job that
     * takes longer still writes its summary, and the row simply shows nothing in the meantime
     * instead of promising something that may never arrive.
     *
     * Under-claiming on purpose. A row that says nothing and then gains a sentence is a small
     * surprise; a row that says "summarising" for a quarter of an hour, or forever because the job
     * never ran, is a bug report.
     */
    pendingGraceMs: number;
    /**
     * How old a bundle must be before the sweeper reclaims it.
     *
     * Derived from what a job's life can actually cost rather than picked: the dispatch delay
     * (60s) plus one run of the background-task Lambda, whose timeout is 900 seconds
     * (`ApiBackgroundTask.ts:32`, the AWS maximum). The summary job has `maxIterations: 1`, so it
     * gets one run and no continuations — a worst case of roughly sixteen minutes.
     *
     * An hour is therefore about four times the realistic ceiling. It is not a guarantee on every
     * runtime: the standalone worker allows 24 hours (`WorkerTaskService.ts:11`), so a
     * pathologically slow job there could still be swept. That is survivable because sweeping a
     * running job is a soft failure — the job finds no values and completes without a summary. One
     * lost sentence, not a corrupt record.
     */
    sweepThresholdMs: number;
}

export const DEFAULT_ACTIVITY_SUMMARY_CONFIG: IActivitySummaryConfig = {
    enabled: true,
    maxPaths: 30,
    freeTextMinLength: 200,
    minFreeTextPaths: 2,
    singleFreeTextMinPaths: 4,
    // The DynamoDB item limit is 400 KB including CMS meta, and nothing validates it anywhere, so
    // the headroom is deliberate rather than tight.
    maxValueBytes: 100 * 1024,
    debounceWindowMs: 60 * 1000,
    dispatchDelaySeconds: 60,
    quotedValueMaxLength: 60,
    maxNamedFields: 3,
    pendingGraceMs: 5 * 60 * 1000,
    sweepThresholdMs: 60 * 60 * 1000
};

export const ActivitySummaryConfig = createAbstraction<IActivitySummaryConfig>(
    "ActivityLog/SummaryConfig"
);

export namespace ActivitySummaryConfig {
    export type Interface = IActivitySummaryConfig;
}
