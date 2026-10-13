import { createAbstraction, type Result } from "@webiny/feature/api";
import type { StepCandidate } from "~/domain/routing/types.js";
import type { RoutingDependencyError } from "~/domain/routing/errors.js";
import type {
    ReviewInvalidStateError,
    ReviewNotFoundError,
    ReviewPersistenceError,
    ReviewStepNotCurrentError,
    ReviewStepNotReassignableError,
    ReviewValidationError
} from "~/domain/review/errors.js";
import type { WorkflowNotFoundError, WorkflowPersistenceError } from "~/domain/workflow/errors.js";

/** The request dialog's picker: the stored workflow's step, before a review exists. */
export interface ListRequestStepCandidatesInput {
    workflowId: string;
    stepId: string;
    /** Namespace id, e.g. "cms.article" or "wb.page"; the workflow must be bound to it. */
    model: string;
    targetId: string;
    targetRevisionId: string;
    requesterId: string;
}

/** The reassign dialog: the step of an existing review, from its snapshot. */
export interface ListReviewStepCandidatesInput {
    reviewId: string;
    stepId: string;
}

export type ListStepCandidatesInput =
    | ListRequestStepCandidatesInput
    | ListReviewStepCandidatesInput;

export interface IListStepCandidatesUseCaseErrors {
    workflowNotFound: WorkflowNotFoundError;
    workflowPersistence: WorkflowPersistenceError;
    reviewNotFound: ReviewNotFoundError;
    reviewPersistence: ReviewPersistenceError;
    validation: ReviewValidationError;
    invalidState: ReviewInvalidStateError;
    stepNotCurrent: ReviewStepNotCurrentError;
    stepNotReassignable: ReviewStepNotReassignableError;
    routing: RoutingDependencyError;
}

type UseCaseError = IListStepCandidatesUseCaseErrors[keyof IListStepCandidatesUseCaseErrors];

export interface IListStepCandidatesUseCase {
    execute(input: ListStepCandidatesInput): Promise<Result<StepCandidate[], UseCaseError>>;
}

/**
 * Who could take a step (spec 10, D97, D104, D128, R120): every member of the step's teams except
 * the requester, by display name, with exclusion and read access. Internal (D132): the wrappers
 * check write access (request) or `reassign` and read access (reassign), and null
 * `excludedReason` for viewers without `editor` / `reassign`.
 */
export const ListStepCandidatesUseCase = createAbstraction<IListStepCandidatesUseCase>(
    "ListStepCandidatesUseCase"
);

export namespace ListStepCandidatesUseCase {
    export type Interface = IListStepCandidatesUseCase;
    export type Input = ListStepCandidatesInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<StepCandidate[], UseCaseError>>;
}
