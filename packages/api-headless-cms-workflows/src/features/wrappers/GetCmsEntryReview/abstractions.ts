import { createAbstraction, type Result } from "@webiny/feature/api";
import type { ReviewWithViewerFlags } from "@webiny/api-workflows/domain/review/types.js";
import type { CmsEntryReviewGuardService } from "../CmsEntryReviewGuardService/index.js";

export interface GetCmsEntryReviewInput {
    id: string;
}

export interface IGetCmsEntryReviewUseCaseErrors {
    guard: CmsEntryReviewGuardService.Error;
}

type UseCaseError = IGetCmsEntryReviewUseCaseErrors[keyof IGetCmsEntryReviewUseCaseErrors];

export interface IGetCmsEntryReviewUseCase {
    execute(input: GetCmsEntryReviewInput): Promise<Result<ReviewWithViewerFlags, UseCaseError>>;
}

/**
 * A CMS review with the reading user's flags (spec 5.3, R62); needs read access to the target.
 * Returns the engine's full review in phase 2. Phase 3 adds the redaction here, in the wrapper and
 * not in the resolver: per-user skip entries and `excludedReason` are stripped for viewers without
 * `editor` / `reassign` (spec 8, D89, D127, D128, D133).
 */
export const GetCmsEntryReviewUseCase = createAbstraction<IGetCmsEntryReviewUseCase>(
    "GetCmsEntryReviewUseCase"
);

export namespace GetCmsEntryReviewUseCase {
    export type Interface = IGetCmsEntryReviewUseCase;
    export type Input = GetCmsEntryReviewInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<ReviewWithViewerFlags, UseCaseError>>;
}
