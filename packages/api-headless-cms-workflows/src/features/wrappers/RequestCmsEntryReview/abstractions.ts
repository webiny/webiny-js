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

export interface RequestCmsEntryReviewInput {
    /** Namespace id, `cms.<modelId>`. */
    model: string;
    targetId: string;
    targetRevisionId: string;
    /**
     * The review title (D135); trimmed and at least 5 characters, checked by the engine (R89).
     * Missing or empty: the entry's title.
     */
    title?: string | null;
    /** Reviewer picks per step (D22); malformed picks are rejected by the engine (R61). */
    picks?: ReviewPick[];
}

export interface IRequestCmsEntryReviewUseCaseErrors {
    notAuthenticated: WorkflowsNotAuthenticatedError;
    notAuthorized: WorkflowsNotAuthorizedError;
    targetNotFound: ReviewTargetNotFoundError;
    persistence: ReviewPersistenceError;
    request: RequestReviewUseCase.Error;
}

type UseCaseError = IRequestCmsEntryReviewUseCaseErrors[keyof IRequestCmsEntryReviewUseCaseErrors];

export interface IRequestCmsEntryReviewUseCase {
    execute(input: RequestCmsEntryReviewInput): Promise<Result<ReviewData, UseCaseError>>;
}

/** Request a review of a CMS entry revision; needs write access to it (spec 5.1, D77). */
export const RequestCmsEntryReviewUseCase = createAbstraction<IRequestCmsEntryReviewUseCase>(
    "RequestCmsEntryReviewUseCase"
);

export namespace RequestCmsEntryReviewUseCase {
    export type Interface = IRequestCmsEntryReviewUseCase;
    export type Input = RequestCmsEntryReviewInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<ReviewData, UseCaseError>>;
}
