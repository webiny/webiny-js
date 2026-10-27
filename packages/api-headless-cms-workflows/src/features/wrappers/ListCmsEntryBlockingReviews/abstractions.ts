import { createAbstraction, type Result } from "@webiny/feature/api";
import type { WorkflowBlockingReview } from "@webiny/api-workflows/domain/workflow/types.js";
import type { WorkflowPersistenceError } from "@webiny/api-workflows/domain/workflow/errors.js";
import type {
    ReviewPersistenceError,
    ReviewValidationError
} from "@webiny/api-workflows/domain/review/errors.js";
import type { WorkflowsNotAuthenticatedError } from "@webiny/api-workflows/domain/permissions/errors.js";

/** The most entry ids one call checks (R265); the admin sends chunks of this size. */
export const BLOCKING_REVIEWS_MAX_IDS = 200;

export interface ListCmsEntryBlockingReviewsInput {
    /** The model id, without the `cms.` prefix. */
    modelId: string;
    /** Entry ids, not revision ids. At most `BLOCKING_REVIEWS_MAX_IDS`. */
    entryIds: string[];
}

export interface IListCmsEntryBlockingReviewsUseCaseErrors {
    notAuthenticated: WorkflowsNotAuthenticatedError;
    validation: ReviewValidationError;
    persistence: ReviewPersistenceError;
    bindingPersistence: WorkflowPersistenceError;
}

type UseCaseError =
    IListCmsEntryBlockingReviewsUseCaseErrors[keyof IListCmsEntryBlockingReviewsUseCaseErrors];

export interface IListCmsEntryBlockingReviewsUseCase {
    execute(
        input: ListCmsEntryBlockingReviewsInput
    ): Promise<Result<WorkflowBlockingReview[], UseCaseError>>;
}

/**
 * The reviews in progress of a list of entries, for the admin's bulk trash of all loaded rows
 * (R265, D164): only entries the viewer can read are considered, so the answer never names a
 * review of content the viewer cannot see. Everything unreadable or unbound answers an empty list.
 */
export const ListCmsEntryBlockingReviewsUseCase =
    createAbstraction<IListCmsEntryBlockingReviewsUseCase>("ListCmsEntryBlockingReviewsUseCase");

export namespace ListCmsEntryBlockingReviewsUseCase {
    export type Interface = IListCmsEntryBlockingReviewsUseCase;
    export type Input = ListCmsEntryBlockingReviewsInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<WorkflowBlockingReview[], UseCaseError>>;
}
