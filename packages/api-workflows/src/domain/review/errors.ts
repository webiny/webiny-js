import { BaseError } from "@webiny/feature/api";
import type { PersistenceErrorSource } from "../PersistenceErrorSource.js";
import { PersistenceError } from "~/domain/PersistenceError.js";
import { hasErrorSource } from "~/domain/hasErrorSource.js";
import type { ActorType, ReviewData, ReviewState, StepState } from "./types.js";
import type { WorkflowBlockingReview } from "~/domain/workflow/types.js";

export type ReviewTransitionName =
    | "reach"
    | "start"
    | "takeOver"
    | "approve"
    | "reject"
    | "cancel"
    | "reassign"
    | "fail"
    | "restart";

export interface ReviewNotFoundErrorData {
    id: string;
}

export class ReviewNotFoundError extends BaseError<ReviewNotFoundErrorData> {
    override readonly code = "Workflows/Review/NotFound" as const;

    constructor(data: ReviewNotFoundErrorData) {
        super({ message: `Review "${data.id}" was not found.`, data });
    }
}

export class ReviewPersistenceError extends PersistenceError {
    override readonly code = "Workflows/Review/Persistence" as const;

    constructor(error: PersistenceErrorSource) {
        super("The review could not be read or saved.", error);
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

export interface ReviewStepRunNotFoundErrorData {
    reviewId: string;
    stepId: string;
    taskId: string;
}

/**
 * The step has no attempt with this task id (R257): the step is not on the review, or the task id
 * is neither the step's current task nor one of its earlier runs. Keeps the step run read from
 * opening arbitrary background tasks.
 */
export class ReviewStepRunNotFoundError extends BaseError<ReviewStepRunNotFoundErrorData> {
    override readonly code = "Workflows/Review/StepRunNotFound" as const;

    constructor(data: ReviewStepRunNotFoundErrorData) {
        super({
            message: `Step "${data.stepId}" of review "${data.reviewId}" has no run with task "${data.taskId}".`,
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

export interface ReviewStepNotReassignableErrorData extends ReviewStepErrorData {
    ownerType: ActorType | null;
}

/** Reassign needs an `awaiting` or human-owned `inReview` step (D33). */
export class ReviewStepNotReassignableError extends BaseError<ReviewStepNotReassignableErrorData> {
    override readonly code = "Workflows/Review/StepNotReassignable" as const;

    constructor(data: ReviewStepNotReassignableErrorData) {
        super({ message: "AI and automation steps cannot be reassigned.", data });
    }
}

export interface ReviewReassignTargetInvalidErrorData extends ReviewStepErrorData {
    userId: string;
    /** One of the fixed routing reasons (R112), never an exclusion's own text (D89, D97). */
    reason: string;
}

/** The chosen user fails the pick rules: requester, not a member, excluded, cannot read (D33, R119). */
export class ReviewReassignTargetInvalidError extends BaseError<ReviewReassignTargetInvalidErrorData> {
    override readonly code = "Workflows/Review/ReassignTargetInvalid" as const;

    constructor(data: ReviewReassignTargetInvalidErrorData) {
        super({ message: `This user cannot review this step: ${data.reason}`, data });
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

export interface ReviewTargetRevisionNotFoundErrorData {
    model: string;
    /** The revision looked for. */
    targetRevisionId: string;
}

export interface ReviewTargetIdNotFoundErrorData {
    model: string;
    /** The target (entry) id looked for, when no revision id is known. */
    targetId: string;
}

/** Names the revision or, when no revision id is known, the target (entry) looked for. */
export type ReviewTargetNotFoundErrorData =
    | ReviewTargetRevisionNotFoundErrorData
    | ReviewTargetIdNotFoundErrorData;

export class ReviewTargetNotFoundError extends BaseError<ReviewTargetNotFoundErrorData> {
    override readonly code = "Workflows/Review/TargetNotFound" as const;

    constructor(data: ReviewTargetNotFoundErrorData) {
        // One branch per data shape: `BaseError` takes each union member separately.
        super(
            "targetRevisionId" in data
                ? {
                      message: `Content "${data.targetRevisionId}" of the model "${data.model}" was not found.`,
                      data
                  }
                : {
                      message: `Content "${data.targetId}" of the model "${data.model}" was not found.`,
                      data
                  }
        );
    }
}

export interface ReviewTargetSyncErrorCause {
    /** The sync failure's code, when it has one; its text stays on the server (R146). */
    code?: string;
}

export interface ReviewTargetSyncErrorData {
    /** The review as saved; the save is not rolled back (R16). */
    review: ReviewData;
    cause: ReviewTargetSyncErrorCause;
}

export interface ReviewTargetSyncErrorParams {
    review: ReviewData;
    /** The sync failure. */
    error: PersistenceErrorSource;
}

/**
 * The review was saved and its events were published, but writing `system.workflow` to the target
 * failed (R16). Returned by `ReviewSaver`; the app target adapters' syncs produce the underlying
 * errors, which can be raw CMS or storage errors. Like `PersistenceError`, the message is fixed,
 * `data` carries only the failure's code, and the raw failure is on `source` for server logs
 * (not enumerable, so it is never serialised) (R146).
 */
export class ReviewTargetSyncError extends BaseError<ReviewTargetSyncErrorData> {
    override readonly code = "Workflows/Review/TargetSync" as const;
    /** The raw sync failure, for server logs only; never sent to a client. */
    declare public readonly source: PersistenceErrorSource;

    constructor(params: ReviewTargetSyncErrorParams) {
        super({
            message: "The review was saved, but updating its content failed.",
            data: { review: params.review, cause: { code: params.error.code } }
        });
        const source = hasErrorSource(params.error) ? params.error.source : params.error;
        Object.defineProperty(this, "source", { value: source, enumerable: false });
    }
}

export type ReviewTargetLockedAction = "update" | "move";

export interface ReviewTargetLockedErrorData {
    reviewId: string;
    /** Namespace id of the target. */
    model: string;
    targetRevisionId: string;
    reviewState: ReviewState;
    action: ReviewTargetLockedAction;
}

/**
 * The target cannot change while its review is active: updates are blocked for any active review,
 * including approved and rejected ones (D62, D80); moves only while it is in progress (D84).
 * Thrown by the app adapters' handlers on bound models (R54, R55).
 */
export class ReviewTargetLockedError extends BaseError<ReviewTargetLockedErrorData> {
    override readonly code = "Workflows/Review/TargetLocked" as const;

    constructor(data: ReviewTargetLockedErrorData) {
        super({
            message:
                data.action === "move"
                    ? "This content cannot be moved to another folder while its review is in progress."
                    : `This content cannot be changed while its review is active (review state "${data.reviewState}"). Create a new revision to make changes.`,
            data
        });
    }
}

export interface ReviewPublishBlockedErrorData {
    /** Namespace id of the target. */
    model: string;
    targetRevisionId: string;
    /** The workflow bound to the model. */
    workflowId: string;
    /** State of the revision's active review; `null` when it has none. */
    reviewState: ReviewState | null;
}

/**
 * On a workflow-bound model a revision is published only with an approved review (D79); thrown by
 * the app adapters' publish handlers (R53). Creating content as published is not a publish and is
 * not blocked (D134 point 2).
 */
export class ReviewPublishBlockedError extends BaseError<ReviewPublishBlockedErrorData> {
    override readonly code = "Workflows/Review/PublishBlocked" as const;

    constructor(data: ReviewPublishBlockedErrorData) {
        super({
            message: data.reviewState
                ? `This content can only be published after its review is approved. The review is "${data.reviewState}".`
                : "This content can only be published after its review is approved. Request a review first.",
            data
        });
    }
}

export type ReviewActiveOnTrashAction = "trash" | "delete";

export interface ReviewActiveOnTrashErrorData {
    /** Namespace id of the targets. */
    model: string;
    action: ReviewActiveOnTrashAction;
    /**
     * Every in-progress review the action would end, each with its target, title and current
     * step; one target for trash and delete, possibly several for `deleteMultiple`.
     */
    reviews: WorkflowBlockingReview[];
}

/**
 * Trashing or deleting content with a review in progress is refused (D134); the admin warns and,
 * on confirm, calls the app's cancel-for-delete wrapper and repeats the action (R73, R74). Thrown
 * by the app adapters' trash and delete handlers on bound models.
 */
export class ReviewActiveOnTrashError extends BaseError<ReviewActiveOnTrashErrorData> {
    override readonly code = "Workflows/Review/ActiveReviewOnTrash" as const;

    constructor(data: ReviewActiveOnTrashErrorData) {
        super({
            message:
                data.action === "trash"
                    ? "This content has a review in progress. Trashing it cancels the review."
                    : "This content has a review in progress. Deleting it cancels the review.",
            data
        });
    }
}

/**
 * A target editor refused or could not do what the AI tool asked (R172): an unknown or read-only
 * path, a value the target rejects, or no editor for the namespace. The message is shown to the
 * model, so it holds only a validation text or a generic text, never a provider or storage error
 * (the adapter logs that one, R87). Returned by `ReviewTargetEditor` and `ReviewTargetEditorService`.
 */
export class ReviewTargetEditorError extends BaseError {
    override readonly code = "Workflows/ReviewTarget/EditorError" as const;

    constructor(message: string) {
        super({ message });
    }
}
