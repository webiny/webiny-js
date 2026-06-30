import { createAbstraction, type Result } from "@webiny/feature/api";
import type {
    ExperimentAnalyticsConfig,
    ExperimentGoals,
    ExperimentTargeting,
    ExperimentTrafficSplit,
    WbExperiment
} from "~/domain/experiment/abstractions.js";
import {
    ExperimentNotAuthorizedError,
    ExperimentNotFoundError,
    ExperimentPersistenceError,
    ExperimentValidationError
} from "~/domain/experiment/errors.js";

export interface IUpdateExperimentData {
    name?: string;
    trafficSplit?: ExperimentTrafficSplit;
    targeting?: ExperimentTargeting;
    goals?: ExperimentGoals;
    analytics?: ExperimentAnalyticsConfig;
}

export interface IUpdateExperimentParams {
    id: string;
    data: IUpdateExperimentData;
}

export interface IUpdateExperimentRepository {
    execute(params: IUpdateExperimentParams): Promise<Result<WbExperiment, RepositoryError>>;
}

export interface IUpdateExperimentRepositoryErrors {
    notFound: ExperimentNotFoundError;
    validation: ExperimentValidationError;
    persistence: ExperimentPersistenceError;
}

type RepositoryError = IUpdateExperimentRepositoryErrors[keyof IUpdateExperimentRepositoryErrors];

export const UpdateExperimentRepository = createAbstraction<IUpdateExperimentRepository>(
    "Wb/UpdateExperimentRepository"
);

export namespace UpdateExperimentRepository {
    export type Interface = IUpdateExperimentRepository;
    export type Params = IUpdateExperimentParams;
    export type Return = Promise<Result<WbExperiment, RepositoryError>>;
    export type Error = RepositoryError;
}

export interface IUpdateExperimentUseCase {
    execute(params: IUpdateExperimentParams): Promise<Result<WbExperiment, UseCaseError>>;
}

export interface IUpdateExperimentUseCaseErrors {
    notAuthorized: ExperimentNotAuthorizedError;
    notFound: ExperimentNotFoundError;
    validation: ExperimentValidationError;
    persistence: ExperimentPersistenceError;
}

type UseCaseError = IUpdateExperimentUseCaseErrors[keyof IUpdateExperimentUseCaseErrors];

/** Update an experiment's configuration (name, traffic split, targeting, goals, analytics). */
export const UpdateExperimentUseCase = createAbstraction<IUpdateExperimentUseCase>(
    "Wb/UpdateExperimentUseCase"
);

export namespace UpdateExperimentUseCase {
    export type Interface = IUpdateExperimentUseCase;
    export type Params = IUpdateExperimentParams;
    export type Return = Promise<Result<WbExperiment, UseCaseError>>;
    export type Error = UseCaseError;
}
