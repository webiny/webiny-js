import { createAbstraction, type Result } from "@webiny/feature/api";
import type { WbPage } from "~/domain/page/abstractions.js";
import type { WbVariantContent } from "~/domain/variant/abstractions.js";
import type {
    ExperimentNotAuthorizedError,
    ExperimentNotFoundError,
    ExperimentPersistenceError,
    ExperimentValidationError
} from "~/domain/experiment/errors.js";
import type {
    VariantNotAuthorizedError,
    VariantNotFoundError,
    VariantPersistenceError
} from "~/domain/variant/errors.js";
import type { PageNotFoundError, PagePersistenceError } from "~/domain/page/errors.js";

/** Use case input: conclude an experiment by graduating one variant into a new revision. */
export interface IGraduateVariantParams {
    experimentId: string;
    variantId: string;
}

/** Repository input: the winning variant content has already been resolved by the use case. */
export interface IGraduateVariantRepositoryParams {
    experimentId: string;
    baselineRevisionId: string;
    variantId: string;
    content: WbVariantContent;
}

export interface IGraduateVariantRepository {
    execute(params: IGraduateVariantRepositoryParams): Promise<Result<WbPage, RepositoryError>>;
}

export interface IGraduateVariantRepositoryErrors {
    notFound: PageNotFoundError;
    persistence: PagePersistenceError;
    experimentPersistence: ExperimentPersistenceError;
}

type RepositoryError = IGraduateVariantRepositoryErrors[keyof IGraduateVariantRepositoryErrors];

export const GraduateVariantRepository = createAbstraction<IGraduateVariantRepository>(
    "Wb/GraduateVariantRepository"
);

export namespace GraduateVariantRepository {
    export type Interface = IGraduateVariantRepository;
    export type Params = IGraduateVariantRepositoryParams;
    export type Return = Promise<Result<WbPage, RepositoryError>>;
    export type Error = RepositoryError;
}

export interface IGraduateVariantUseCase {
    execute(params: IGraduateVariantParams): Promise<Result<WbPage, UseCaseError>>;
}

export interface IGraduateVariantUseCaseErrors {
    notAuthorized: ExperimentNotAuthorizedError;
    experimentNotFound: ExperimentNotFoundError;
    variantNotFound: VariantNotFoundError;
    variantNotAuthorized: VariantNotAuthorizedError;
    variantPersistence: VariantPersistenceError;
    validation: ExperimentValidationError;
    notFound: PageNotFoundError;
    persistence: PagePersistenceError;
    experimentPersistence: ExperimentPersistenceError;
}

type UseCaseError = IGraduateVariantUseCaseErrors[keyof IGraduateVariantUseCaseErrors];

/**
 * Conclude an experiment by graduating a winning variant into a new page revision (N+1).
 * That revision is an ordinary, reviewable revision that goes through the normal publishing
 * workflow. This is the single bridge from an experiment back into the revision timeline.
 */
export const GraduateVariantUseCase = createAbstraction<IGraduateVariantUseCase>(
    "Wb/GraduateVariantUseCase"
);

export namespace GraduateVariantUseCase {
    export type Interface = IGraduateVariantUseCase;
    export type Params = IGraduateVariantParams;
    export type Return = Promise<Result<WbPage, UseCaseError>>;
    export type Error = UseCaseError;
    export type Page = WbPage;
}
