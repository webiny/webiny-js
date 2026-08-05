import { createAbstraction, type Result } from "@webiny/feature/api";
import type { WbPage } from "~/domain/page/abstractions.js";
import type { WbVariantContent } from "~/domain/variant/abstractions.js";
import type { ExperimentPersistenceError } from "~/domain/experiment/errors.js";
import type { PageNotFoundError, PagePersistenceError } from "~/domain/page/errors.js";

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
