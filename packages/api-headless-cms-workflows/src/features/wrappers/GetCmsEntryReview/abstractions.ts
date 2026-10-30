import { createAbstraction, type Result } from "@webiny/feature/api";
import type { ReviewWithAssignmentsAndViewerFlags } from "@webiny/api-workflows/domain/assignment/types.js";
import type { ListReviewAssignmentsUseCase } from "@webiny/api-workflows/features/assignment/ListReviewAssignments/index.js";
import type { CmsEntryReviewGuardService } from "../CmsEntryReviewGuardService/index.js";

export interface GetCmsEntryReviewInput {
    id: string;
}

export interface IGetCmsEntryReviewUseCaseErrors {
    guard: CmsEntryReviewGuardService.Error;
    assignments: ListReviewAssignmentsUseCase.Error;
}

type UseCaseError = IGetCmsEntryReviewUseCaseErrors[keyof IGetCmsEntryReviewUseCaseErrors];

export interface IGetCmsEntryReviewUseCase {
    execute(
        input: GetCmsEntryReviewInput
    ): Promise<Result<ReviewWithAssignmentsAndViewerFlags, UseCaseError>>;
}

/**
 * A CMS review with the reading user's flags (spec 5.3, R62) and the assignment-log entries of
 * each step (D127); needs read access to the target. Skip entries are dropped for viewers without
 * `editor` / `reassign` here, in the wrapper and not in the resolver (spec 8, D89, R96).
 */
export const GetCmsEntryReviewUseCase = createAbstraction<IGetCmsEntryReviewUseCase>(
    "GetCmsEntryReviewUseCase"
);

export namespace GetCmsEntryReviewUseCase {
    export type Interface = IGetCmsEntryReviewUseCase;
    export type Input = GetCmsEntryReviewInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<ReviewWithAssignmentsAndViewerFlags, UseCaseError>>;
}
