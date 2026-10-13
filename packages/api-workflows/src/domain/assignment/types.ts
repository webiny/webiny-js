import type { Actor, ReviewData, ReviewStep, ReviewViewerFlags } from "~/domain/review/types.js";

/**
 * `outcome`: who got the step (pick, rule, strategy, pool, start, take over, reassign). `skip`: a
 * person passed over, with the reason (requester, excluded, not a member, cannot read); only
 * viewers with `editor` or `reassign` see these (D89, D127).
 */
export type AssignmentRecordKind = "outcome" | "skip";

/**
 * Why a step has its owner (R109). `rule`: a rule's user target; a rule's team target leaves the
 * strategy name or `pool` with the rule in `ruleId`. `poolStart`, `takeOver` and `reassign` are
 * the transitions that change the owner after the step was reached.
 */
export type AssignmentSource =
    | "picked"
    | "rule"
    | "roundRobin"
    | "leastLoaded"
    | "pool"
    | "poolStart"
    | "takeOver"
    | "reassign";

/**
 * One assignment decision, before it is tied to a saved review (R117): the resolver and the
 * transitions produce these, `ReviewSaver` writes them after the save.
 */
export interface AssignmentDecision {
    kind: AssignmentRecordKind;
    /**
     * The owner (outcome) or the person passed over (skip); `null` for the pool and for a skipped
     * rule whose team target is not one of the step's teams.
     */
    userId: string | null;
    source: AssignmentSource;
    /** The rule that decided or was skipped; `null` otherwise. */
    ruleId: string | null;
    /** Who acted, for take over and reassign. */
    by: Actor | null;
    /**
     * A fixed text for skips and pool fall-through (R112, R116). Never an exclusion's own reason
     * (D89, D97).
     */
    reason: string | null;
}

/** One assignment-log record (spec 4.3, D20, D45, D127), written after the review save (R117). */
export interface AssignmentRecordValues extends AssignmentDecision {
    reviewId: string;
    workflowId: string;
    stepId: string;
    assignedOn: string;
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
