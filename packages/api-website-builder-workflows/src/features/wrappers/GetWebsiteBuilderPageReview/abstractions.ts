import { createAbstraction, type Result } from "@webiny/feature/api";
import type { ListReviewAssignmentsUseCase } from "@webiny/api-workflows/features/assignment/ListReviewAssignments/index.js";
import type { WbPageReviewGuardService } from "../WbPageReviewGuardService/index.js";
import type { ReviewWithAssignmentsAndViewerFlags } from "@webiny/api-workflows/domain/assignment/types.js";

export interface GetWebsiteBuilderPageReviewInput {
    id: string;
}

export interface IGetWebsiteBuilderPageReviewUseCaseErrors {
    guard: WbPageReviewGuardService.Error;
    assignments: ListReviewAssignmentsUseCase.Error;
}

type UseCaseError =
    IGetWebsiteBuilderPageReviewUseCaseErrors[keyof IGetWebsiteBuilderPageReviewUseCaseErrors];

export interface IGetWebsiteBuilderPageReviewUseCase {
    execute(
        input: GetWebsiteBuilderPageReviewInput
    ): Promise<Result<ReviewWithAssignmentsAndViewerFlags, UseCaseError>>;
}

/**
 * A page review with the reading user's flags (spec 5.3, R62); needs read access to the target.
 * Each step carries its assignment-log entries (D127); per-user skip entries are dropped here, in
 * the wrapper and not in the resolver, for viewers without `editor` / `reassign` (spec 8, D89,
 * D133, R96).
 */
export const GetWebsiteBuilderPageReviewUseCase =
    createAbstraction<IGetWebsiteBuilderPageReviewUseCase>("GetWebsiteBuilderPageReviewUseCase");

export namespace GetWebsiteBuilderPageReviewUseCase {
    export type Interface = IGetWebsiteBuilderPageReviewUseCase;
    export type Input = GetWebsiteBuilderPageReviewInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<ReviewWithAssignmentsAndViewerFlags, UseCaseError>>;
}
