import type { Actor } from "~/domain/review/types.js";

/** Input of step transitions. 1a takes the actor explicitly; 1b adds permission checks. */
export interface ReviewActorInput {
    reviewId: string;
    /** The step the caller acted on; fails with `StepNotCurrent` when it is not current (R17). */
    stepId: string;
    actor: Actor;
    /** The actor's teams, checked against the step's `candidateTeamIds` on start and take over. */
    actorTeamIds: string[];
}

export interface ReviewDecisionInput extends ReviewActorInput {
    comment?: string | null;
}

/** Cancel is review-level: no `stepId` (R17). */
export interface CancelReviewInput {
    reviewId: string;
    /** Requester or a user with `workflows.reassign`; checked in phase 1b. */
    actor: Actor;
}
