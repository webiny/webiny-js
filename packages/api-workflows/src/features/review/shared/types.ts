import type { Actor, AiIssue } from "~/domain/review/types.js";

/**
 * Input of step transitions. Internal (D132): the app wrapper builds the actor and team ids
 * (`CurrentReviewViewer`) and checks target access.
 */
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
    /**
     * The findings of an AI decision (D39, R171), stored on the step; omitted means none. Only
     * the engine's own callers set it: the app wrappers build their input from explicit fields
     * and do not expose it (D132).
     */
    issues?: AiIssue[];
}

/** Cancel is review-level: no `stepId` (R17). */
export interface CancelReviewInput {
    reviewId: string;
    /**
     * Requester or `workflows.reassign`; the app wrapper checks target read access and
     * `canCancelByPermission` (D132, D133).
     */
    actor: Actor;
    /**
     * Why the review is cancelled, recorded on the cancelled event; set when content is trashed or
     * deleted with the review in progress (D134), omitted otherwise.
     */
    reason?: string | null;
}
