import { createAbstraction, type Result } from "@webiny/feature/api";
import type {
    ReviewListKind,
    ReviewListMeta,
    ReviewListSort,
    ReviewListWhere,
    ReviewWithViewerFlags
} from "@webiny/api-workflows/domain/review/types.js";
import type {
    WorkflowsNotAuthenticatedError,
    WorkflowsNotAuthorizedError
} from "@webiny/api-workflows/domain/permissions/errors.js";
import type { ReviewPersistenceError } from "@webiny/api-workflows/domain/review/errors.js";
import type { ListReviewsUseCase } from "@webiny/api-workflows/features/review/ListReviews/index.js";

export interface ListCmsEntryReviewsWhere extends ReviewListWhere {
    /** Only the reviews of this model (the model id, without `cms.`, R94). */
    modelId?: string | null;
}

export interface ListCmsEntryReviewsInput {
    list: ReviewListKind;
    where?: ListCmsEntryReviewsWhere | null;
    /** Default per list (D119). */
    sort?: ReviewListSort | null;
    /** Default 20, max 100 (R92). */
    limit?: number | null;
    /** `meta.cursor` of the previous page. */
    after?: string | null;
}

export interface ListCmsEntryReviewsResult {
    items: ReviewWithViewerFlags[];
    meta: ReviewListMeta;
}

export interface IListCmsEntryReviewsUseCaseErrors {
    notAuthenticated: WorkflowsNotAuthenticatedError;
    notAuthorized: WorkflowsNotAuthorizedError;
    persistence: ReviewPersistenceError;
    list: ListReviewsUseCase.Error;
}

type UseCaseError = IListCmsEntryReviewsUseCaseErrors[keyof IListCmsEntryReviewsUseCaseErrors];

export interface IListCmsEntryReviewsUseCase {
    execute(
        input: ListCmsEntryReviewsInput
    ): Promise<Result<ListCmsEntryReviewsResult, UseCaseError>>;
}

/**
 * One page of a review list of the Headless CMS (spec 11, R94): only reviews of bindable models the
 * viewer can read, and only rows whose entry the viewer can read (D76, D133). Failed steps need
 * `reassign` (D112, R95). Each row carries the viewer's flags (A43).
 */
export const ListCmsEntryReviewsUseCase = createAbstraction<IListCmsEntryReviewsUseCase>(
    "ListCmsEntryReviewsUseCase"
);

export namespace ListCmsEntryReviewsUseCase {
    export type Interface = IListCmsEntryReviewsUseCase;
    export type Input = ListCmsEntryReviewsInput;
    export type Where = ListCmsEntryReviewsWhere;
    export type Value = ListCmsEntryReviewsResult;
    export type Error = UseCaseError;
    export type Return = Promise<Result<ListCmsEntryReviewsResult, UseCaseError>>;
}
