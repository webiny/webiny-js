import { BaseError } from "@webiny/feature/api";
import type { ActorType, ReviewData, ReviewState, StepState } from "./types.js";

export type ReviewTransitionName = "reach" | "start" | "takeOver" | "approve" | "reject" | "cancel";

export interface ReviewNotFoundErrorData {
    id: string;
}

export class ReviewNotFoundError extends BaseError<ReviewNotFoundErrorData> {
    override readonly code = "Workflows/Review/NotFound" as const;

    constructor(data: ReviewNotFoundErrorData) {
        super({ message: `Review "${data.id}" was not found.`, data });
    }
}

export interface ReviewPersistenceErrorCause {
    code?: string;
    message: string;
}

export interface ReviewPersistenceErrorData {
    cause: ReviewPersistenceErrorCause;
}

export class ReviewPersistenceError extends BaseError<ReviewPersistenceErrorData> {
    override readonly code = "Workflows/Review/Persistence" as const;

    constructor(error: Error & { code?: string }) {
        super({
            message: error.message,
            data: { cause: { code: error.code, message: error.message } }
        });
    }
}

export class ReviewValidationError extends BaseError {
    override readonly code = "Workflows/Review/Validation" as const;

    constructor(message: string) {
        super({ message });
    }
}

export interface ReviewInvalidStateErrorData {
    reviewId: string;
    transition: ReviewTransitionName;
    reviewState: ReviewState;
    stepId: string | null;
    stepState: StepState | null;
}

export class ReviewInvalidStateError extends BaseError<ReviewInvalidStateErrorData> {
    override readonly code = "Workflows/Review/InvalidState" as const;

    constructor(data: ReviewInvalidStateErrorData) {
        super({
            message: `Cannot ${data.transition} review "${data.reviewId}": the review is "${data.reviewState}" and the current step is "${data.stepState ?? "none"}".`,
            data
        });
    }
}

export interface ReviewStepNotCurrentErrorData {
    reviewId: string;
    /** The step the caller acted on. */
    stepId: string;
    currentStepId: string | null;
}

/** The caller acted on a step that is no longer (or not yet) the current step (R17). */
export class ReviewStepNotCurrentError extends BaseError<ReviewStepNotCurrentErrorData> {
    override readonly code = "Workflows/Review/StepNotCurrent" as const;

    constructor(data: ReviewStepNotCurrentErrorData) {
        super({
            message: `Step "${data.stepId}" is not the current step of review "${data.reviewId}". Reload the review.`,
            data
        });
    }
}

export interface ReviewStepErrorData {
    reviewId: string;
    stepId: string;
}

export interface ReviewActorNotUserErrorData extends ReviewStepErrorData {
    actorType: ActorType;
}

/** Start and take over make a user the owner (spec 5.1); AI and automation never do them. */
export class ReviewActorNotUserError extends BaseError<ReviewActorNotUserErrorData> {
    override readonly code = "Workflows/Review/ActorNotUser" as const;

    constructor(data: ReviewActorNotUserErrorData) {
        super({ message: "Only users can start or take over a step.", data });
    }
}

export class ReviewRequesterCannotReviewError extends BaseError<ReviewStepErrorData> {
    override readonly code = "Workflows/Review/RequesterCannotReview" as const;

    constructor(data: ReviewStepErrorData) {
        super({ message: "The requester cannot review their own content.", data });
    }
}

export class ReviewNotCandidateError extends BaseError<ReviewStepErrorData> {
    override readonly code = "Workflows/Review/NotCandidate" as const;

    constructor(data: ReviewStepErrorData) {
        super({ message: "Only members of the step's teams can review this step.", data });
    }
}

export class ReviewAlreadyOwnerError extends BaseError<ReviewStepErrorData> {
    override readonly code = "Workflows/Review/AlreadyOwner" as const;

    constructor(data: ReviewStepErrorData) {
        super({ message: "You already hold this step.", data });
    }
}

export class ReviewNotOwnerError extends BaseError<ReviewStepErrorData> {
    override readonly code = "Workflows/Review/NotOwner" as const;

    constructor(data: ReviewStepErrorData) {
        super({ message: "Only the step owner can approve or reject it.", data });
    }
}

export interface ReviewStepNotTakeableErrorData extends ReviewStepErrorData {
    ownerType: ActorType | null;
}

export class ReviewStepNotTakeableError extends BaseError<ReviewStepNotTakeableErrorData> {
    override readonly code = "Workflows/Review/StepNotTakeable" as const;

    constructor(data: ReviewStepNotTakeableErrorData) {
        super({ message: "AI and automation steps cannot be taken over.", data });
    }
}

export interface ReviewAlreadyActiveErrorData {
    reviewId: string;
    targetRevisionId: string;
}

export class ReviewAlreadyActiveError extends BaseError<ReviewAlreadyActiveErrorData> {
    override readonly code = "Workflows/Review/AlreadyActive" as const;

    constructor(data: ReviewAlreadyActiveErrorData) {
        super({
            message: `Revision "${data.targetRevisionId}" already has an active review.`,
            data
        });
    }
}

export interface ReviewWorkflowNotFoundErrorData {
    model: string;
}

export class ReviewWorkflowNotFoundError extends BaseError<ReviewWorkflowNotFoundErrorData> {
    override readonly code = "Workflows/Review/WorkflowNotFound" as const;

    constructor(data: ReviewWorkflowNotFoundErrorData) {
        super({ message: `No workflow is bound to the model "${data.model}".`, data });
    }
}

export interface ReviewTargetNotFoundErrorData {
    model: string;
    targetRevisionId: string;
}

export class ReviewTargetNotFoundError extends BaseError<ReviewTargetNotFoundErrorData> {
    override readonly code = "Workflows/Review/TargetNotFound" as const;

    constructor(data: ReviewTargetNotFoundErrorData) {
        super({
            message: `Content "${data.targetRevisionId}" of the model "${data.model}" was not found.`,
            data
        });
    }
}

export interface ReviewTargetSyncErrorData {
    /** The review as saved; the save is not rolled back (R16). */
    review: ReviewData;
}

export interface ReviewTargetSyncErrorParams {
    review: ReviewData;
    /** The sync failure. */
    error: Error;
}

/**
 * The review was saved and its events were published, but writing `system.workflow` to the target
 * failed (R16). Returned by `ReviewSaver`; phase 2 adapters produce the underlying errors.
 */
export class ReviewTargetSyncError extends BaseError<ReviewTargetSyncErrorData> {
    override readonly code = "Workflows/Review/TargetSync" as const;

    constructor(params: ReviewTargetSyncErrorParams) {
        super({
            message: `The review was saved, but updating its content failed: ${params.error.message}`,
            data: { review: params.review }
        });
    }
}
