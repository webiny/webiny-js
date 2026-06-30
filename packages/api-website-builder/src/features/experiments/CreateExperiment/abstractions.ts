import { createAbstraction, type Result } from "@webiny/feature/api";
import type { DomainEvent, IEventHandler } from "@webiny/api-core/features/eventPublisher/index.js";
import type {
    ExperimentAnalyticsConfig,
    ExperimentGoals,
    ExperimentTargeting,
    ExperimentTrafficSplit,
    WbExperiment
} from "~/domain/experiment/abstractions.js";
import {
    ExperimentNotAuthorizedError,
    ExperimentPersistenceError,
    ExperimentValidationError
} from "~/domain/experiment/errors.js";

export interface ICreateExperimentParams {
    pageEntryId: string;
    baselineRevisionId: string;
    name: string;
    trafficSplit?: ExperimentTrafficSplit;
    targeting?: ExperimentTargeting;
    goals?: ExperimentGoals;
    analytics?: ExperimentAnalyticsConfig;
}

// Repository abstraction.

export interface ICreateExperimentRepository {
    execute(params: ICreateExperimentParams): Promise<Result<WbExperiment, RepositoryError>>;
}

export interface ICreateExperimentRepositoryErrors {
    validation: ExperimentValidationError;
    persistence: ExperimentPersistenceError;
}

type RepositoryError = ICreateExperimentRepositoryErrors[keyof ICreateExperimentRepositoryErrors];

export const CreateExperimentRepository = createAbstraction<ICreateExperimentRepository>(
    "Wb/CreateExperimentRepository"
);

export namespace CreateExperimentRepository {
    export type Interface = ICreateExperimentRepository;
    export type Params = ICreateExperimentParams;
    export type Return = Promise<Result<WbExperiment, RepositoryError>>;
    export type Error = RepositoryError;
}

// Use case abstraction.

export interface ICreateExperimentUseCase {
    execute(params: ICreateExperimentParams): Promise<Result<WbExperiment, UseCaseError>>;
}

export interface ICreateExperimentUseCaseErrors {
    notAuthorized: ExperimentNotAuthorizedError;
    validation: ExperimentValidationError;
    persistence: ExperimentPersistenceError;
}

type UseCaseError = ICreateExperimentUseCaseErrors[keyof ICreateExperimentUseCaseErrors];

/** Create a new experiment against a published page revision. */
export const CreateExperimentUseCase = createAbstraction<ICreateExperimentUseCase>(
    "Wb/CreateExperimentUseCase"
);

export namespace CreateExperimentUseCase {
    export type Interface = ICreateExperimentUseCase;
    export type Params = ICreateExperimentParams;
    export type Return = Promise<Result<WbExperiment, UseCaseError>>;
    export type Error = UseCaseError;
    export type Experiment = WbExperiment;
}

// Event payloads + handler abstractions.

export interface ExperimentBeforeCreatePayload {
    input: ICreateExperimentParams;
}

export interface ExperimentAfterCreatePayload {
    experiment: WbExperiment;
}

/** Hook into experiment lifecycle before an experiment is created. */
export const ExperimentBeforeCreateEventHandler = createAbstraction<
    IEventHandler<DomainEvent<ExperimentBeforeCreatePayload>>
>("Wb/ExperimentBeforeCreateEventHandler");

export namespace ExperimentBeforeCreateEventHandler {
    export type Interface = IEventHandler<DomainEvent<ExperimentBeforeCreatePayload>>;
    export type Event = DomainEvent<ExperimentBeforeCreatePayload>;
}

/** Hook into experiment lifecycle after an experiment is created. */
export const ExperimentAfterCreateEventHandler = createAbstraction<
    IEventHandler<DomainEvent<ExperimentAfterCreatePayload>>
>("Wb/ExperimentAfterCreateEventHandler");

export namespace ExperimentAfterCreateEventHandler {
    export type Interface = IEventHandler<DomainEvent<ExperimentAfterCreatePayload>>;
    export type Event = DomainEvent<ExperimentAfterCreatePayload>;
}
