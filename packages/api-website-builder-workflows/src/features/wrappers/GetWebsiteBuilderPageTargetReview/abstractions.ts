import { createAbstraction, type Result } from "@webiny/feature/api";
import type {
    WorkflowsNotAuthenticatedError,
    WorkflowsNotAuthorizedError
} from "@webiny/api-workflows/domain/permissions/errors.js";
import type { ReviewPersistenceError } from "@webiny/api-workflows/domain/review/errors.js";
import type { GetTargetReviewUseCase } from "@webiny/api-workflows/features/review/GetTargetReview/index.js";
import type { ListReviewAssignmentsUseCase } from "@webiny/api-workflows/features/assignment/ListReviewAssignments/index.js";
import type { ReviewWithAssignmentsAndViewerFlags } from "@webiny/api-workflows/domain/assignment/types.js";

export interface GetWebsiteBuilderPageTargetReviewInput {
    /** The page revision id (`<pageId>#<version>`). */
    targetRevisionId: string;
}

export interface IGetWebsiteBuilderPageTargetReviewUseCaseErrors {
    notAuthenticated: WorkflowsNotAuthenticatedError;
    notAuthorized: WorkflowsNotAuthorizedError;
    persistence: ReviewPersistenceError;
    get: GetTargetReviewUseCase.Error;
    assignments: ListReviewAssignmentsUseCase.Error;
}

type UseCaseError =
    IGetWebsiteBuilderPageTargetReviewUseCaseErrors[keyof IGetWebsiteBuilderPageTargetReviewUseCaseErrors];

export interface IGetWebsiteBuilderPageTargetReviewUseCase {
    execute(
        input: GetWebsiteBuilderPageTargetReviewInput
    ): Promise<Result<ReviewWithAssignmentsAndViewerFlags | null, UseCaseError>>;
}

/**
 * The active review of a page revision for the reading user, or `null` (spec 10, D23). Needs read
 * access to the page, checked before the review is read; a missing page reads as unreadable, as
 * in the guard. Steps carry their assignment-log entries, redacted like the get by id (R96).
 */
export const GetWebsiteBuilderPageTargetReviewUseCase =
    createAbstraction<IGetWebsiteBuilderPageTargetReviewUseCase>(
        "GetWebsiteBuilderPageTargetReviewUseCase"
    );

export namespace GetWebsiteBuilderPageTargetReviewUseCase {
    export type Interface = IGetWebsiteBuilderPageTargetReviewUseCase;
    export type Input = GetWebsiteBuilderPageTargetReviewInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<ReviewWithAssignmentsAndViewerFlags | null, UseCaseError>>;
}
