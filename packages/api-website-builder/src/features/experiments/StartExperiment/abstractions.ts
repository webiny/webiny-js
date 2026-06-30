import { createAbstraction, type Result } from "@webiny/feature/api";
import type { DomainEvent, IEventHandler } from "@webiny/api-core/features/eventPublisher/index.js";
import type { WbExperiment } from "~/domain/experiment/abstractions.js";
import type {
    ExperimentAlreadyActiveError,
    ExperimentNotAuthorizedError,
    ExperimentNotFoundError,
    ExperimentPersistenceError,
    ExperimentValidationError
} from "~/domain/experiment/errors.js";

export interface IStartExperimentParams {
    id: string;
}

export interface IStartExperimentRepository {
    execute(id: string): Promise<Result<WbExperiment, RepositoryError>>;
}

export interface IStartExperimentRepositoryErrors {
    notFound: ExperimentNotFoundError;
    persistence: ExperimentPersistenceError;
}

type RepositoryError = IStartExperimentRepositoryErrors[keyof IStartExperimentRepositoryErrors];

export const StartExperimentRepository = createAbstraction<IStartExperimentRepository>(
    "Wb/StartExperimentRepository"
);

export namespace StartExperimentRepository {
    export type Interface = IStartExperimentRepository;
    export type Return = Promise<Result<WbExperiment, RepositoryError>>;
    export type Error = RepositoryError;
}

export interface IStartExperimentUseCase {
    execute(params: IStartExperimentParams): Promise<Result<WbExperiment, UseCaseError>>;
}

export interface IStartExperimentUseCaseErrors {
    notAuthorized: ExperimentNotAuthorizedError;
    notFound: ExperimentNotFoundError;
    alreadyActive: ExperimentAlreadyActiveError;
    validation: ExperimentValidationError;
    persistence: ExperimentPersistenceError;
}

type UseCaseError = IStartExperimentUseCaseErrors[keyof IStartExperimentUseCaseErrors];

/** Start an experiment against its baseline revision. One active experiment per revision. */
export const StartExperimentUseCase = createAbstraction<IStartExperimentUseCase>(
    "Wb/StartExperimentUseCase"
);

export namespace StartExperimentUseCase {
    export type Interface = IStartExperimentUseCase;
    export type Params = IStartExperimentParams;
    export type Return = Promise<Result<WbExperiment, UseCaseError>>;
    export type Error = UseCaseError;
    export type Experiment = WbExperiment;
}

export interface ExperimentAfterStartPayload {
    experiment: WbExperiment;
}

/** Hook into experiment lifecycle after an experiment is started. */
export const ExperimentAfterStartEventHandler = createAbstraction<
    IEventHandler<DomainEvent<ExperimentAfterStartPayload>>
>("Wb/ExperimentAfterStartEventHandler");

export namespace ExperimentAfterStartEventHandler {
    export type Interface = IEventHandler<DomainEvent<ExperimentAfterStartPayload>>;
    export type Event = DomainEvent<ExperimentAfterStartPayload>;
}
