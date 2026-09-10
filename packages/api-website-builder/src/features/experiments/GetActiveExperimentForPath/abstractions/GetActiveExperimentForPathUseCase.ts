import { createAbstraction, type Result } from "@webiny/feature/api";
import type { WbExperiment } from "~/domain/experiment/abstractions.js";
import type {
    ExperimentNotAuthorizedError,
    ExperimentPausedError,
    ExperimentPersistenceError,
    NoActiveExperimentError
} from "~/domain/experiment/errors.js";
import type {
    PageNotAuthorizedError,
    PageNotFoundError,
    PagePersistenceError
} from "~/domain/page/errors.js";

/**
 * The active experiment for a requested path. Resolved against the live (published) page and
 * the PUBLISHED experiment for it — draft experiments/variants never serve. The set of
 * participating variants is derived from the experiment's traffic split (keyed by variant
 * entryId), and each variant's published content is fetched separately by the SDK.
 */
export interface ActiveExperimentForPath {
    experiment: WbExperiment;
    revisionId: string;
    pageEntryId: string;
    path: string;
}

// Use case. Fails with NoActiveExperimentError (none running) or ExperimentPausedError (paused).

export interface IGetActiveExperimentForPathUseCase {
    execute(path: string): Promise<Result<ActiveExperimentForPath, UseCaseError>>;
}

export interface IGetActiveExperimentForPathUseCaseErrors {
    notAuthorized: ExperimentNotAuthorizedError;
    noActiveExperiment: NoActiveExperimentError;
    paused: ExperimentPausedError;
    notFound: PageNotFoundError;
    persistence: ExperimentPersistenceError;
    pageNotAuthorized: PageNotAuthorizedError;
    pagePersistence: PagePersistenceError;
}

type UseCaseError =
    IGetActiveExperimentForPathUseCaseErrors[keyof IGetActiveExperimentForPathUseCaseErrors];

/** Resolve the active, published, non-paused experiment for the live page at a path. */
export const GetActiveExperimentForPathUseCase =
    createAbstraction<IGetActiveExperimentForPathUseCase>("Wb/GetActiveExperimentForPathUseCase");

export namespace GetActiveExperimentForPathUseCase {
    export type Interface = IGetActiveExperimentForPathUseCase;
    export type Return = Promise<Result<ActiveExperimentForPath, UseCaseError>>;
    export type Error = UseCaseError;
}
