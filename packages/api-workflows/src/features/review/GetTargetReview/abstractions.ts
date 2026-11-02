import { createAbstraction, type Result } from "@webiny/feature/api";
import type { ReviewData } from "~/domain/review/types.js";
import type { ReviewPersistenceError } from "~/domain/review/errors.js";

export interface GetTargetReviewInput {
    /** Namespace id, e.g. "cms.article" or "wb.page". */
    model: string;
    targetRevisionId: string;
}

export interface IGetTargetReviewUseCaseErrors {
    persistence: ReviewPersistenceError;
}

type UseCaseError = IGetTargetReviewUseCaseErrors[keyof IGetTargetReviewUseCaseErrors];

export interface IGetTargetReviewUseCase {
    execute(input: GetTargetReviewInput): Promise<Result<ReviewData | null, UseCaseError>>;
}

/**
 * The active review of a target revision, or `null` (D23), with stuck detection: a step whose
 * task ended without a result is failed and saved on the way out (R152). Internal (D132): used by
 * the per-app target review wrappers, which check read access to the target first
 * (`GetCmsEntryTargetReviewUseCase`, `GetWebsiteBuilderPageTargetReviewUseCase`). The save block
 * and publish rule use the read-only `GetActiveTargetReviewUseCase`.
 */
export const GetTargetReviewUseCase =
    createAbstraction<IGetTargetReviewUseCase>("GetTargetReviewUseCase");

export namespace GetTargetReviewUseCase {
    export type Interface = IGetTargetReviewUseCase;
    export type Input = GetTargetReviewInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<ReviewData | null, UseCaseError>>;
}
