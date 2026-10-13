import { createAbstraction, type Result } from "@webiny/feature/api";
import type { StepCandidate } from "@webiny/api-workflows/domain/routing/types.js";
import type { WorkflowsNotAuthorizedError } from "@webiny/api-workflows/domain/permissions/errors.js";
import type { ListStepCandidatesUseCase } from "@webiny/api-workflows/features/routing/ListStepCandidates/index.js";
import type { CmsEntryReviewGuardService } from "../CmsEntryReviewGuardService/index.js";

export interface ListCmsEntryReviewStepCandidatesInput {
    reviewId: string;
    stepId: string;
}

export interface IListCmsEntryReviewStepCandidatesUseCaseErrors {
    guard: CmsEntryReviewGuardService.Error;
    notAuthorized: WorkflowsNotAuthorizedError;
    candidates: ListStepCandidatesUseCase.Error;
}

type UseCaseError =
    IListCmsEntryReviewStepCandidatesUseCaseErrors[keyof IListCmsEntryReviewStepCandidatesUseCaseErrors];

export interface IListCmsEntryReviewStepCandidatesUseCase {
    execute(
        input: ListCmsEntryReviewStepCandidatesInput
    ): Promise<Result<StepCandidate[], UseCaseError>>;
}

/**
 * Who a CMS review step can be reassigned to (spec 10, D128, R120): read access to the target and
 * `reassign`, as for the reassign itself (R125); the step from the review's snapshot.
 */
export const ListCmsEntryReviewStepCandidatesUseCase =
    createAbstraction<IListCmsEntryReviewStepCandidatesUseCase>(
        "ListCmsEntryReviewStepCandidatesUseCase"
    );

export namespace ListCmsEntryReviewStepCandidatesUseCase {
    export type Interface = IListCmsEntryReviewStepCandidatesUseCase;
    export type Input = ListCmsEntryReviewStepCandidatesInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<StepCandidate[], UseCaseError>>;
}
