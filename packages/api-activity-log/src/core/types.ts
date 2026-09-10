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

/** Publishing workflow actions, derived from step-status diffing rather than from events. */
export type ActivityReviewAction =
    | "review.submitted"
    | "review.step.approved"
    | "review.step.rejected"
    | "review.changeRequest.opened"
    | "review.changeRequest.resolved"
    | "review.changeRequest.reopened"
    | "review.signOff.provided"
    | "review.signOff.withdrawn"
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
 * One record. Immutable once written.
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
}

/** A record before storage assigns it an id. */
export type ActivityRecordInput = Omit<ActivityRecord, "id">;
