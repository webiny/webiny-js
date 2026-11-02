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
import type { ListReviewsUseCase } from "@webiny/api-workflows/features/review/ListReviews/index.js";

export interface ListWebsiteBuilderPageReviewsInput {
    list: ReviewListKind;
    /** `reviewState` and `stepState` only with `myRequests`; the engine refuses them elsewhere (R91). */
    where?: ReviewListWhere | null;
    /** Defaults per list: oldest first, newest first for `myRequests` (D119). */
    sort?: ReviewListSort | null;
    /** Default 20, at most 100 (R92). */
    limit?: number | null;
    /** `meta.cursor` of the previous page. */
    after?: string | null;
}

export interface ListWebsiteBuilderPageReviewsOutput {
    items: ReviewWithViewerFlags[];
    meta: ReviewListMeta;
}

export interface IListWebsiteBuilderPageReviewsUseCaseErrors {
    notAuthenticated: WorkflowsNotAuthenticatedError;
    notAuthorized: WorkflowsNotAuthorizedError;
    list: ListReviewsUseCase.Error;
}

type UseCaseError =
    IListWebsiteBuilderPageReviewsUseCaseErrors[keyof IListWebsiteBuilderPageReviewsUseCaseErrors];

export interface IListWebsiteBuilderPageReviewsUseCase {
    execute(
        input: ListWebsiteBuilderPageReviewsInput
    ): Promise<Result<ListWebsiteBuilderPageReviewsOutput, UseCaseError>>;
}

/**
 * The viewer's page review lists (spec 11, D47, D133): `wb.page` reviews only, each row a page the
 * Website Builder page list would show the viewer (D76, Q77): own pages only with an own-only
 * permission, none in a folder the viewer cannot read. Each row carries the viewer's flags. Failed
 * steps need `reassign` (D112, R95).
 */
export const ListWebsiteBuilderPageReviewsUseCase =
    createAbstraction<IListWebsiteBuilderPageReviewsUseCase>(
        "ListWebsiteBuilderPageReviewsUseCase"
    );

export namespace ListWebsiteBuilderPageReviewsUseCase {
    export type Interface = IListWebsiteBuilderPageReviewsUseCase;
    export type Input = ListWebsiteBuilderPageReviewsInput;
    export type Output = ListWebsiteBuilderPageReviewsOutput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<ListWebsiteBuilderPageReviewsOutput, UseCaseError>>;
}
