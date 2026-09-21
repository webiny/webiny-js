/**
 * The kind of thing an activity record describes.
 *
 * Always `"cms-entry"` in v1. It is stored on every record from the start rather than implied,
 * so that Website Builder pages, templates and File Manager versions can be recorded later
 * without a data migration.
 */
export type ActivityTargetType = "cms-entry";

export interface ActivityTarget {
    type: ActivityTargetType;
    id: string;
}

/**
 * Known actions. The storage layer treats `action` as an opaque string — this union exists for
 * producers, so that a typo in a handler is a compile error rather than a mislabelled record.
 *
 * Entry actions map onto the CMS entry event set. Note that `entry.trash` and `entry.delete` both
 * arrive as `Cms/Entry/AfterDelete`, discriminated by the payload's `permanent` flag.
 */
export type ActivityEntryAction =
    | "entry.create"
    | "entry.update"
    | "entry.revision.create"
    | "entry.revision.delete"
    | "entry.revision.describe"
    | "entry.publish"
    | "entry.unpublish"
    | "entry.republish"
    | "entry.move"
    | "entry.trash"
    | "entry.restore"
    | "entry.delete";

/**
 * Publishing workflow actions.
 *
 * Taken from APW's own domain events, not from diffing. The brief specified diffing step status
 * across a content review update, which was correct for APW at 5.44 and is not correct on this
 * branch — see the Checkpoint 4 notes in the plan.
 *
 * "Change request" and "sign-off" are deliberately absent: those concepts existed in the
 * `api-apw` package, which no longer exists, and there is nothing on this branch to map them
 * onto. They are dropped rather than approximated with the nearest equivalent.
 */
export type ActivityReviewAction =
    | "review.submitted"
    | "review.step.started"
    | "review.step.approved"
    | "review.step.rejected"
    | "review.step.takenOver"
    | "review.cancelled"
    | "review.approved"
    | "review.rejected"
    | "review.deleted";

export type ActivityAction = ActivityEntryAction | ActivityReviewAction;

/**
 * Structural change to a list or dynamic zone, reported at block level without descending into
 * the block. Absent on an ordinary value change.
 */
export type ChangesetOperation = "added" | "removed" | "moved" | "replaced";

/**
 * One changed field.
 *
 * Deliberately carries no hash, which is a departure from the original brief. Hashes are computed
 * and used inside the differ but never persisted, for three reasons. Nothing reads a stored hash
 * across records: a no-op save is already signalled by an empty changeset. A stored hash leaks the
 * new value of a low-cardinality field to anyone who can read the timeline — and for the lowest
 * cardinality fields the changeset entry leaks it regardless, since recording that a boolean
 * changed states its new value. And the one genuine consumer, detecting a revert to a previous
 * value, is not specified.
 *
 * This is a one-way door for records written before it is revisited: a hash cannot be computed
 * retroactively from a record that never stored one, so adding hashes later would give revert
 * detection only from that point onward. Accepted.
 */
export interface ChangesetEntry {
    /**
     * Fully qualified path from the target root. Item ids are unique only within a single array,
     * never within an entry, so an unqualified path is ambiguous.
     */
    path: string;
    /**
     * Field label as it read at the moment of the write, so the timeline stays legible after the
     * model is renamed or the field is removed.
     */
    label: string;
    /** Set only for structural changes. */
    operation?: ChangesetOperation;
}

export interface ActivityActor {
    id: string;
    type: string;
    displayName: string;
}

/**
 * The part of a target an action was about, when it was not about the target as a whole.
 *
 * A review transition needs this: "step approved" is not useful without saying which step. The
 * label is captured at write time for the same reason changeset labels are — a workflow can be
 * reconfigured and its steps renamed, and an old record should stay legible.
 */
export interface ActivitySubject {
    id: string;
    label: string;
}

/**
 * Why a record carries no summary.
 *
 * Stored for diagnosis and never exposed to a reader: "no summary" is overwhelmingly the ordinary
 * case, not a failure, and surfacing the reason would turn a normal row into an explanation. It is
 * here because working out why summaries are absent on a customer instance is otherwise guesswork.
 */
export type SummarySkipReason =
    /** The writer was not a person at the admin UI — an API key, or a background task. */
    | "not-interactive"
    /** Only blocks moved, added or removed. The operation is the whole description. */
    | "structural-only"
    /** Fewer than two free-text fields changed; the field names already say it. */
    | "too-few-text-fields"
    /** More paths changed than prose can usefully compress. */
    | "too-many-paths"
    /** The serialised values exceeded the ceiling. */
    | "values-too-large"
    /** No AI model is configured, or the capability could not be resolved. */
    | "ai-unavailable"
    /** Summaries are switched off for this installation. */
    | "disabled"
    /** The job ran but could not produce a usable sentence. */
    | "generation-failed"
    /** The job never ran and the sweeper reclaimed the values. */
    | "abandoned"
    /** This save joined a run already covered by a pending job, so it needs none of its own. */
    | "covered-by-run";

/**
 * How a summary was produced.
 *
 * `deterministic` is rendered from the changed values inside the write, and the values are never
 * stored. `ai` is written by a model in a background job, which is why those values have to sit on
 * the record until it runs.
 */
export type SummaryKind = "ai" | "deterministic";

/**
 * The before and after values for one changed path, held only until the job consumes them.
 *
 * This is the one place content values exist on a record, and they exist briefly: the job that
 * reads them clears them in the same write that stores the summary, and the sweeper clears them if
 * the job never runs.
 */
export interface SummaryValueEntry {
    path: string;
    label: string;
    before: unknown;
    after: unknown;
}

/**
 * What the summary job needs, and what it leaves behind.
 *
 * Kept as one optional object rather than three loose fields so that "has a job in flight" is a
 * single presence check, and so clearing it is one assignment rather than three that could drift
 * apart.
 */
export interface ActivitySummaryState {
    /** The dispatched task, so a debounced run can tell whether the job is still pending. */
    taskId?: string;
    /**
     * Values spanning the run this record's job covers. Present only while a job is pending.
     *
     * Absent once the job has written its summary, once the sweeper has reclaimed it, or when no
     * job was dispatched at all.
     */
    values?: SummaryValueEntry[];
    /** When the values were first written, which is what the sweeper ages against. */
    valuesWrittenOn?: string;
    /** Set when the job settles without a summary, or when no job was dispatched. */
    reason?: SummarySkipReason;
}

/**
 * One record.
 *
 * Append-only in the sense that matters — capture never revisits a record, and nothing rewrites
 * what a record says about the change it describes. A summary arriving later is the one exception,
 * and it is an addition rather than a correction.
 */
export interface ActivityRecord {
    id: string;
    targetType: ActivityTargetType;
    /** Target identity without a revision suffix. */
    targetId: string;
    /** The revision the change landed on, including its suffix. */
    revision: string;
    /** ISO 8601, UTC. */
    timestamp: string;
    actor: ActivityActor;
    action: string;
    /** Where the write came from. Mandatory — never inferred at read time. */
    source: string;
    /** Shared by every record a single operation produces, so bulk actions group. */
    correlationId: string;
    changeset: ChangesetEntry[];
    /** True when the changeset hit the cap and was rolled up to a common parent. */
    truncated: boolean;
    /** Present when the action concerned one part of the target, such as a workflow step. */
    subject?: ActivitySubject;
    /**
     * Whether the actor attached a note — an approval or rejection comment.
     *
     * The note's *content* is never stored. It is author-written free text about the content,
     * which is precisely what "no content values ever" exists to exclude, and the field most
     * likely to hold something sensitive. Its presence is recorded because a rejection with an
     * explanation and a bare rejection are materially different in an audit trail, and presence
     * on its own leaks nothing.
     */
    hasNote?: boolean;
    /**
     * A short sentence describing what changed.
     *
     * Unlike everything else on the record, this may quote content values as they stood at the
     * time of the change — both kinds do, by different means. Absent where a save had nothing to
     * describe: a publish, a move, a purely structural edit.
     */
    summary?: string;
    /**
     * How the summary above was arrived at. Absent when there is no summary.
     *
     * Load-bearing at the read end rather than bookkeeping: a mechanical summary is a rendering of
     * recorded values, and a model's summary is prose that may be wrong. The timeline marks the
     * second and not the first, so a reader can tell which one they are looking at.
     */
    summaryKind?: SummaryKind;
    /** Job bookkeeping and the transient values. Never exposed to a reader. */
    summaryState?: ActivitySummaryState;
}

/** A record before storage assigns it an id. */
export type ActivityRecordInput = Omit<ActivityRecord, "id">;

/**
 * Whether a record is still waiting for the job dispatched for it.
 *
 * Pending is "carries values and has not settled" — derived rather than stored, because a stored
 * flag is a third thing that can disagree with the other two. One definition, used by the
 * dispatcher to decide whether a save joins a run in progress and by the read path to tell a reader
 * a sentence is coming.
 */
export const isSummaryPending = (record: ActivityRecord): boolean => {
    return (
        Boolean(record.summaryState?.values?.length) &&
        !record.summary &&
        !record.summaryState?.reason
    );
};
