import type { AssignmentDecision } from "~/domain/assignment/types.js";
import type { Actor, ReviewStepAssignment, StepState } from "./types.js";

/**
 * Domain facts recorded by the `Review` aggregate. `ReviewSaver` publishes one event per fact
 * after the review is persisted. Each fact carries what a later audit app needs (spec 9.5).
 */
export interface ReviewStepChange {
    stepId: string;
    fromState: StepState;
    toState: StepState;
}

export interface ReviewRequestedFact {
    type: "requested";
    occurredOn: string;
    actor: Actor;
}

export interface ReviewStepReachedFact {
    type: "stepReached";
    occurredOn: string;
    /** Who caused the step to be reached: the requester or the approver of the previous step. */
    actor: Actor;
    /** Who got the step; `null` when it went to the pool. */
    owner: Actor | null;
    change: ReviewStepChange;
    assignment: ReviewStepAssignment;
    /** The resolver's skips and outcome; `ReviewSaver` writes them after the save (R117). */
    records: AssignmentDecision[];
}

export interface ReviewStepStartedFact {
    type: "stepStarted";
    occurredOn: string;
    actor: Actor;
    change: ReviewStepChange;
    /** One `poolStart` outcome (R117, A49). */
    records: AssignmentDecision[];
}

export interface ReviewStepTakenOverFact {
    type: "stepTakenOver";
    occurredOn: string;
    actor: Actor;
    change: ReviewStepChange;
    previousOwner: Actor;
    /** One `takeOver` outcome with `by` (R117, A49). */
    records: AssignmentDecision[];
}

export interface ReviewStepReassignedFact {
    type: "stepReassigned";
    occurredOn: string;
    /** Who reassigned: a user with `workflows.reassign` (the wrapper checked it, D132). */
    actor: Actor;
    change: ReviewStepChange;
    /** The chosen user. */
    owner: Actor;
    /** `null` when the step was `awaiting`. */
    previousOwner: Actor | null;
    /** One `reassign` outcome with `by` (R117). */
    records: AssignmentDecision[];
}

export interface ReviewStepApprovedFact {
    type: "stepApproved";
    occurredOn: string;
    actor: Actor;
    change: ReviewStepChange;
    comment: string | null;
}

export interface ReviewStepRejectedFact {
    type: "stepRejected";
    occurredOn: string;
    actor: Actor;
    change: ReviewStepChange;
    comment: string | null;
}

export interface ReviewCancelledFact {
    type: "cancelled";
    occurredOn: string;
    actor: Actor;
    /** The step that was current when the review was cancelled. */
    stepId: string | null;
    stepState: StepState | null;
    /** Why the review was cancelled, e.g. "content trashed" (D134); `null` for a normal cancel. */
    reason: string | null;
}

export interface ReviewApprovedFact {
    type: "approved";
    occurredOn: string;
    actor: Actor;
}

export type ReviewFact =
    | ReviewRequestedFact
    | ReviewStepReachedFact
    | ReviewStepStartedFact
    | ReviewStepTakenOverFact
    | ReviewStepReassignedFact
    | ReviewStepApprovedFact
    | ReviewStepRejectedFact
    | ReviewCancelledFact
    | ReviewApprovedFact;
