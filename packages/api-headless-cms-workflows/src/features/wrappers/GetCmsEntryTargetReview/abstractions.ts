import { createAbstraction, type Result } from "@webiny/feature/api";
import type { ReviewWithAssignmentsAndViewerFlags } from "@webiny/api-workflows/domain/assignment/types.js";
import type {
    WorkflowsNotAuthenticatedError,
    WorkflowsNotAuthorizedError
} from "@webiny/api-workflows/domain/permissions/errors.js";
import type {
    ReviewPersistenceError,
    ReviewTargetNotFoundError
} from "@webiny/api-workflows/domain/review/errors.js";
import type { GetTargetReviewUseCase } from "@webiny/api-workflows/features/review/GetTargetReview/index.js";
import type { ListReviewAssignmentsUseCase } from "@webiny/api-workflows/features/assignment/ListReviewAssignments/index.js";

export interface GetCmsEntryTargetReviewInput {
    /** Namespace id, `cms.<modelId>`. */
    model: string;
    targetRevisionId: string;
}

export interface IGetCmsEntryTargetReviewUseCaseErrors {
    notAuthenticated: WorkflowsNotAuthenticatedError;
    notAuthorized: WorkflowsNotAuthorizedError;
    targetNotFound: ReviewTargetNotFoundError;
    persistence: ReviewPersistenceError;
    get: GetTargetReviewUseCase.Error;
    assignments: ListReviewAssignmentsUseCase.Error;
}

type UseCaseError =
    IGetCmsEntryTargetReviewUseCaseErrors[keyof IGetCmsEntryTargetReviewUseCaseErrors];

export interface IGetCmsEntryTargetReviewUseCase {
    execute(
        input: GetCmsEntryTargetReviewInput
    ): Promise<Result<ReviewWithAssignmentsAndViewerFlags | null, UseCaseError>>;
}

/**
 * The active review of a CMS entry revision with the viewer's flags and redacted assignment
 * entries, or `null` (spec 10, R96). Needs read access to the revision: a missing, trashed or
 * unreadable revision is `NotAuthorized` (R108); a namespace of another app is not found (R46).
 */
export const GetCmsEntryTargetReviewUseCase = createAbstraction<IGetCmsEntryTargetReviewUseCase>(
    "GetCmsEntryTargetReviewUseCase"
);

export namespace GetCmsEntryTargetReviewUseCase {
    export type Interface = IGetCmsEntryTargetReviewUseCase;
    export type Input = GetCmsEntryTargetReviewInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<ReviewWithAssignmentsAndViewerFlags | null, UseCaseError>>;
}
