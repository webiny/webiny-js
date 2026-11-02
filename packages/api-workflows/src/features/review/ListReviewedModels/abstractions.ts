import { createAbstraction, type Result } from "@webiny/feature/api";
import type { ReviewPersistenceError } from "~/domain/review/errors.js";

export interface IListReviewedModelsUseCaseErrors {
    persistence: ReviewPersistenceError;
}

type UseCaseError = IListReviewedModelsUseCaseErrors[keyof IListReviewedModelsUseCaseErrors];

export interface IListReviewedModelsUseCase {
    execute(): Promise<Result<string[], UseCaseError>>;
}

/**
 * The namespaces with active reviews (e.g. "cms.article", "wb.page"), the only rows the review
 * lists return; read with one query and kept for the request. Internal (D132): no permission check, the namespaces reveal no content.
 * App wrappers use it to load folder rules only for namespaces a review list can show (Q77).
 */
export const ListReviewedModelsUseCase = createAbstraction<IListReviewedModelsUseCase>(
    "ListReviewedModelsUseCase"
);

export namespace ListReviewedModelsUseCase {
    export type Interface = IListReviewedModelsUseCase;
    export type Error = UseCaseError;
    export type Return = Promise<Result<string[], UseCaseError>>;
}
