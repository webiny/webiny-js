import { createAbstraction, type Result } from "@webiny/feature/api";
import type { ReviewData, ReviewPick } from "@webiny/api-workflows/domain/review/types.js";
import type {
    WorkflowsNotAuthenticatedError,
    WorkflowsNotAuthorizedError
} from "@webiny/api-workflows/domain/permissions/errors.js";
import type {
    ReviewPersistenceError,
    ReviewTargetNotFoundError
} from "@webiny/api-workflows/domain/review/errors.js";
import type { RequestReviewUseCase } from "@webiny/api-workflows/features/review/RequestReview/index.js";

export interface RequestWebsiteBuilderPageReviewInput {
    /** The page id. */
    targetId: string;
    /** The page revision id. */
    targetRevisionId: string;
    /**
     * The review title (D135). Trimmed by the engine; at least 5 characters when given (D100,
     * R89); missing or empty means the page title.
     */
    title?: string | null;
    /** Reviewer picks per step (D22); malformed picks are rejected by the engine (R61). */
    picks?: ReviewPick[];
}

export interface IRequestWebsiteBuilderPageReviewUseCaseErrors {
    notAuthenticated: WorkflowsNotAuthenticatedError;
    notAuthorized: WorkflowsNotAuthorizedError;
    targetNotFound: ReviewTargetNotFoundError;
    persistence: ReviewPersistenceError;
    request: RequestReviewUseCase.Error;
}

type UseCaseError =
    IRequestWebsiteBuilderPageReviewUseCaseErrors[keyof IRequestWebsiteBuilderPageReviewUseCaseErrors];

export interface IRequestWebsiteBuilderPageReviewUseCase {
    execute(input: RequestWebsiteBuilderPageReviewInput): Promise<Result<ReviewData, UseCaseError>>;
}

/**
 * Request a review of a page revision; needs write access to it (spec 5.1, D77). A missing page is
 * not found; a page without write access (including folder access) is not authorized.
 */
export const RequestWebsiteBuilderPageReviewUseCase =
    createAbstraction<IRequestWebsiteBuilderPageReviewUseCase>(
        "RequestWebsiteBuilderPageReviewUseCase"
    );

export namespace RequestWebsiteBuilderPageReviewUseCase {
    export type Interface = IRequestWebsiteBuilderPageReviewUseCase;
    export type Input = RequestWebsiteBuilderPageReviewInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<ReviewData, UseCaseError>>;
}
