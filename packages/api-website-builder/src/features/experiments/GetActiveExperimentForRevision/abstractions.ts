import { createAbstraction, type Result } from "@webiny/feature/api";
import type { WbExperiment } from "~/domain/experiment/abstractions.js";
import type {
    ExperimentNotAuthorizedError,
    ExperimentPersistenceError,
    NoActiveExperimentError
} from "~/domain/experiment/errors.js";

export interface IGetActiveExperimentForRevisionRepository {
    execute(revisionId: string): Promise<Result<WbExperiment, RepositoryError>>;
}

export interface IGetActiveExperimentForRevisionRepositoryErrors {
    noActiveExperiment: NoActiveExperimentError;
    persistence: ExperimentPersistenceError;
}

type RepositoryError =
    IGetActiveExperimentForRevisionRepositoryErrors[keyof IGetActiveExperimentForRevisionRepositoryErrors];

export const GetActiveExperimentForRevisionRepository =
    createAbstraction<IGetActiveExperimentForRevisionRepository>(
        "Wb/GetActiveExperimentForRevisionRepository"
    );

export namespace GetActiveExperimentForRevisionRepository {
    export type Interface = IGetActiveExperimentForRevisionRepository;
    export type Return = Promise<Result<WbExperiment, RepositoryError>>;
    export type Error = RepositoryError;
}

export interface IGetActiveExperimentForRevisionUseCase {
    execute(revisionId: string): Promise<Result<WbExperiment, UseCaseError>>;
}

export interface IGetActiveExperimentForRevisionUseCaseErrors {
    notAuthorized: ExperimentNotAuthorizedError;
    noActiveExperiment: NoActiveExperimentError;
    persistence: ExperimentPersistenceError;
}

type UseCaseError =
    IGetActiveExperimentForRevisionUseCaseErrors[keyof IGetActiveExperimentForRevisionUseCaseErrors];

/** Retrieve the single active (running) experiment pinned to a given revision, if any. */
export const GetActiveExperimentForRevisionUseCase =
    createAbstraction<IGetActiveExperimentForRevisionUseCase>(
        "Wb/GetActiveExperimentForRevisionUseCase"
    );

export namespace GetActiveExperimentForRevisionUseCase {
    export type Interface = IGetActiveExperimentForRevisionUseCase;
    export type Return = Promise<Result<WbExperiment, UseCaseError>>;
    export type Error = UseCaseError;
    export type Experiment = WbExperiment;
}
