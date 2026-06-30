import { createAbstraction, type Result } from "@webiny/feature/api";
import type { WbExperiment } from "~/domain/experiment/abstractions.js";
import type { WbVariant } from "~/domain/variant/abstractions.js";
import type {
    ExperimentNotAuthorizedError,
    ExperimentPersistenceError
} from "~/domain/experiment/errors.js";
import type {
    PageNotAuthorizedError,
    PageNotFoundError,
    PagePersistenceError
} from "~/domain/page/errors.js";
import type {
    VariantNotAuthorizedError,
    VariantPersistenceError
} from "~/domain/variant/errors.js";

/**
 * The active experiment for a requested path, resolved against the live (published) revision,
 * together with the experiment's "ready" variants. This is the shape the Next.js SDK uses to
 * bucket a visitor server-side. Variant content is fetched separately, per variant, so each
 * variant is its own cacheable object.
 */
export interface ActiveExperimentForPath {
    experiment: WbExperiment;
    variants: WbVariant[];
    revisionId: string;
    pageEntryId: string;
    path: string;
}

export interface IGetActiveExperimentForPathUseCase {
    execute(path: string): Promise<Result<ActiveExperimentForPath | null, UseCaseError>>;
}

export interface IGetActiveExperimentForPathUseCaseErrors {
    notAuthorized: ExperimentNotAuthorizedError;
    notFound: PageNotFoundError;
    persistence: ExperimentPersistenceError;
    pageNotAuthorized: PageNotAuthorizedError;
    pagePersistence: PagePersistenceError;
    variantNotAuthorized: VariantNotAuthorizedError;
    variantPersistence: VariantPersistenceError;
}

type UseCaseError =
    IGetActiveExperimentForPathUseCaseErrors[keyof IGetActiveExperimentForPathUseCaseErrors];

/** Resolve the active experiment (if any) for the live revision at a given path. */
export const GetActiveExperimentForPathUseCase =
    createAbstraction<IGetActiveExperimentForPathUseCase>("Wb/GetActiveExperimentForPathUseCase");

export namespace GetActiveExperimentForPathUseCase {
    export type Interface = IGetActiveExperimentForPathUseCase;
    export type Return = Promise<Result<ActiveExperimentForPath | null, UseCaseError>>;
    export type Error = UseCaseError;
}
