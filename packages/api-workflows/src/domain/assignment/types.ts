import type { Actor, ReviewData, ReviewStep, ReviewViewerFlags } from "~/domain/review/types.js";

/**
 * `outcome`: who got the step (rule, strategy, picked, pool, take over, reassign). `skip`: a
 * person passed over, with the reason (requester, excluded, cannot read); only viewers with
 * `editor` or `reassign` see these (D89, D127).
 */
export type AssignmentRecordKind = "outcome" | "skip";

/** One assignment decision (spec 4.3, D20, D45, D127). Written from phase 4. */
export interface AssignmentRecordValues {
    reviewId: string;
    workflowId: string;
    stepId: string;
    /** `null` for a pool fall-through. */
    userId: string | null;
    assignedOn: string;
    /** Rule id, "strategy", "picked", "reassign", "pool", "poolStart" or "takeOver". */
    source: string;
    /** Who acted, for reassign and take over. */
    by: Actor | null;
    /** For skips and fall-through, e.g. "pick excluded". */
    reason: string | null;
    kind: AssignmentRecordKind;
}

export interface AssignmentRecord extends AssignmentRecordValues {
    id: string;
}

/** A review step with its assignment-log entries, newest first (D127). */
export interface ReviewStepWithAssignments extends ReviewStep {
    assignments: AssignmentRecord[];
}

/** A review as the get-review wrappers return it: each step carries its entries (R96). */
export interface ReviewWithAssignments extends Omit<ReviewData, "steps"> {
    steps: ReviewStepWithAssignments[];
}

/** The get-review wrappers' value: the review with entries and the viewer's flags (spec 5.3). */
export interface ReviewWithAssignmentsAndViewerFlags {
    review: ReviewWithAssignments;
    flags: ReviewViewerFlags;
}
