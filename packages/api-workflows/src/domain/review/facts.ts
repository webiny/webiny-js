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
    change: ReviewStepChange;
    assignment: ReviewStepAssignment;
}

export interface ReviewStepStartedFact {
    type: "stepStarted";
    occurredOn: string;
    actor: Actor;
    change: ReviewStepChange;
}

export interface ReviewStepTakenOverFact {
    type: "stepTakenOver";
    occurredOn: string;
    actor: Actor;
    change: ReviewStepChange;
    previousOwner: Actor;
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
    | ReviewStepApprovedFact
    | ReviewStepRejectedFact
    | ReviewCancelledFact
    | ReviewApprovedFact;
