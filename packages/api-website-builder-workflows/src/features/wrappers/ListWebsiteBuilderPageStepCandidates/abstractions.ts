import { createAbstraction, type Result } from "@webiny/feature/api";
import type { StepCandidate } from "@webiny/api-workflows/domain/routing/types.js";
import type {
    WorkflowsNotAuthenticatedError,
    WorkflowsNotAuthorizedError
} from "@webiny/api-workflows/domain/permissions/errors.js";
import type {
    ReviewPersistenceError,
    ReviewTargetNotFoundError
} from "@webiny/api-workflows/domain/review/errors.js";
import type { ListStepCandidatesUseCase } from "@webiny/api-workflows/features/routing/ListStepCandidates/index.js";
import type { GetWorkflowUseCase } from "@webiny/api-workflows/features/workflow/GetWorkflow/index.js";
import type { WorkflowNotFoundError } from "@webiny/api-workflows/domain/workflow/errors.js";

export interface ListWebsiteBuilderPageStepCandidatesInput {
    workflowId: string;
    stepId: string;
    /** The page id. */
    targetId: string;
    /** The page revision id. */
    targetRevisionId: string;
}

export interface IListWebsiteBuilderPageStepCandidatesUseCaseErrors {
    notAuthenticated: WorkflowsNotAuthenticatedError;
    notAuthorized: WorkflowsNotAuthorizedError;
    targetNotFound: ReviewTargetNotFoundError;
    persistence: ReviewPersistenceError;
    workflow: GetWorkflowUseCase.Error;
    workflowNotFound: WorkflowNotFoundError;
    candidates: ListStepCandidatesUseCase.Error;
}

type UseCaseError =
    IListWebsiteBuilderPageStepCandidatesUseCaseErrors[keyof IListWebsiteBuilderPageStepCandidatesUseCaseErrors];

export interface IListWebsiteBuilderPageStepCandidatesUseCase {
    execute(
        input: ListWebsiteBuilderPageStepCandidatesInput
    ): Promise<Result<StepCandidate[], UseCaseError>>;
}

/**
 * Who could take a step of a page review the viewer is about to request (spec 10, D128, R120):
 * write access to the page revision, as for the request itself (D77); a workflow of another app
 * is not found (R46, R128); exclusion reasons only for `editor` / `reassign` (D97).
 */
export const ListWebsiteBuilderPageStepCandidatesUseCase =
    createAbstraction<IListWebsiteBuilderPageStepCandidatesUseCase>(
        "ListWebsiteBuilderPageStepCandidatesUseCase"
    );

export namespace ListWebsiteBuilderPageStepCandidatesUseCase {
    export type Interface = IListWebsiteBuilderPageStepCandidatesUseCase;
    export type Input = ListWebsiteBuilderPageStepCandidatesInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<StepCandidate[], UseCaseError>>;
}
