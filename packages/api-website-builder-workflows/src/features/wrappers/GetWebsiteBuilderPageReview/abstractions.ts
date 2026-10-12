import { createAbstraction, type Result } from "@webiny/feature/api";
import type { ReviewWithViewerFlags } from "@webiny/api-workflows/domain/review/types.js";
import type { WbPageReviewGuardService } from "../WbPageReviewGuardService/index.js";

export interface GetWebsiteBuilderPageReviewInput {
    id: string;
}

export interface IGetWebsiteBuilderPageReviewUseCaseErrors {
    guard: WbPageReviewGuardService.Error;
}

type UseCaseError =
    IGetWebsiteBuilderPageReviewUseCaseErrors[keyof IGetWebsiteBuilderPageReviewUseCaseErrors];

export interface IGetWebsiteBuilderPageReviewUseCase {
    execute(
        input: GetWebsiteBuilderPageReviewInput
    ): Promise<Result<ReviewWithViewerFlags, UseCaseError>>;
}

/**
 * A page review with the reading user's flags (spec 5.3, R62); needs read access to the target.
 * Returns the engine's full review in phase 2. Phase 3 adds the redaction here, in the wrapper and
 * not in the resolver: per-user skip entries and `excludedReason` are stripped for viewers without
 * `editor` / `reassign` (spec 8, D89, D127, D128, D133).
 */
export const GetWebsiteBuilderPageReviewUseCase =
    createAbstraction<IGetWebsiteBuilderPageReviewUseCase>("GetWebsiteBuilderPageReviewUseCase");

export namespace GetWebsiteBuilderPageReviewUseCase {
    export type Interface = IGetWebsiteBuilderPageReviewUseCase;
    export type Input = GetWebsiteBuilderPageReviewInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<ReviewWithViewerFlags, UseCaseError>>;
}
