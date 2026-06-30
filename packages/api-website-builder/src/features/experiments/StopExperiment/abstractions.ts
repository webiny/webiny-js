import { createAbstraction, type Result } from "@webiny/feature/api";
import type { DomainEvent, IEventHandler } from "@webiny/api-core/features/eventPublisher/index.js";
import type { WbExperiment } from "~/domain/experiment/abstractions.js";
import type {
    ExperimentNotAuthorizedError,
    ExperimentNotFoundError,
    ExperimentPersistenceError,
    ExperimentValidationError
} from "~/domain/experiment/errors.js";

export interface IStopExperimentParams {
    id: string;
}

export interface IStopExperimentRepository {
    execute(id: string): Promise<Result<WbExperiment, RepositoryError>>;
}

export interface IStopExperimentRepositoryErrors {
    notFound: ExperimentNotFoundError;
    persistence: ExperimentPersistenceError;
}

type RepositoryError = IStopExperimentRepositoryErrors[keyof IStopExperimentRepositoryErrors];

export const StopExperimentRepository = createAbstraction<IStopExperimentRepository>(
    "Wb/StopExperimentRepository"
);

export namespace StopExperimentRepository {
    export type Interface = IStopExperimentRepository;
    export type Return = Promise<Result<WbExperiment, RepositoryError>>;
    export type Error = RepositoryError;
}

export interface IStopExperimentUseCase {
    execute(params: IStopExperimentParams): Promise<Result<WbExperiment, UseCaseError>>;
}

export interface IStopExperimentUseCaseErrors {
    notAuthorized: ExperimentNotAuthorizedError;
    notFound: ExperimentNotFoundError;
    validation: ExperimentValidationError;
    persistence: ExperimentPersistenceError;
}

type UseCaseError = IStopExperimentUseCaseErrors[keyof IStopExperimentUseCaseErrors];

/** Stop a running experiment. */
export const StopExperimentUseCase = createAbstraction<IStopExperimentUseCase>(
    "Wb/StopExperimentUseCase"
);

export namespace StopExperimentUseCase {
    export type Interface = IStopExperimentUseCase;
    export type Params = IStopExperimentParams;
    export type Return = Promise<Result<WbExperiment, UseCaseError>>;
    export type Error = UseCaseError;
    export type Experiment = WbExperiment;
}

export interface ExperimentAfterStopPayload {
    experiment: WbExperiment;
    /** Why the experiment was stopped: an explicit user action, or a cascade from publishing. */
    reason: "manual" | "revisionPublished";
}

/** Hook into experiment lifecycle after an experiment is stopped. */
export const ExperimentAfterStopEventHandler = createAbstraction<
    IEventHandler<DomainEvent<ExperimentAfterStopPayload>>
>("Wb/ExperimentAfterStopEventHandler");

export namespace ExperimentAfterStopEventHandler {
    export type Interface = IEventHandler<DomainEvent<ExperimentAfterStopPayload>>;
    export type Event = DomainEvent<ExperimentAfterStopPayload>;
}
