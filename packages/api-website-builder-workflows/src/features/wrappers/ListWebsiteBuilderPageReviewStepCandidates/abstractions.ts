import { createAbstraction, type Result } from "@webiny/feature/api";
import type { StepCandidate } from "@webiny/api-workflows/domain/routing/types.js";
import type { WorkflowsNotAuthorizedError } from "@webiny/api-workflows/domain/permissions/errors.js";
import type { ListStepCandidatesUseCase } from "@webiny/api-workflows/features/routing/ListStepCandidates/index.js";
import type { WbPageReviewGuardService } from "../WbPageReviewGuardService/index.js";

export interface ListWebsiteBuilderPageReviewStepCandidatesInput {
    reviewId: string;
    stepId: string;
}

export interface IListWebsiteBuilderPageReviewStepCandidatesUseCaseErrors {
    guard: WbPageReviewGuardService.Error;
    notAuthorized: WorkflowsNotAuthorizedError;
    candidates: ListStepCandidatesUseCase.Error;
}

type UseCaseError =
    IListWebsiteBuilderPageReviewStepCandidatesUseCaseErrors[keyof IListWebsiteBuilderPageReviewStepCandidatesUseCaseErrors];

export interface IListWebsiteBuilderPageReviewStepCandidatesUseCase {
    execute(
        input: ListWebsiteBuilderPageReviewStepCandidatesInput
    ): Promise<Result<StepCandidate[], UseCaseError>>;
}

/**
 * Who a page review step can be reassigned to (spec 10, D128, R120): read access to the page and
 * `reassign`, as for the reassign itself (R125); the step from the review's snapshot.
 */
export const ListWebsiteBuilderPageReviewStepCandidatesUseCase =
    createAbstraction<IListWebsiteBuilderPageReviewStepCandidatesUseCase>(
        "ListWebsiteBuilderPageReviewStepCandidatesUseCase"
    );

export namespace ListWebsiteBuilderPageReviewStepCandidatesUseCase {
    export type Interface = IListWebsiteBuilderPageReviewStepCandidatesUseCase;
    export type Input = ListWebsiteBuilderPageReviewStepCandidatesInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<StepCandidate[], UseCaseError>>;
}
