import { createAbstraction, type Result } from "@webiny/feature/api";
import type { WbExperiment } from "~/domain/experiment/abstractions.js";
import type {
    ExperimentNotAuthorizedError,
    ExperimentPersistenceError
} from "~/domain/experiment/errors.js";

export interface IListExperimentsParams {
    pageEntryId: string;
}

export interface IListExperimentsRepository {
    execute(params: IListExperimentsParams): Promise<Result<WbExperiment[], RepositoryError>>;
}

export interface IListExperimentsRepositoryErrors {
    persistence: ExperimentPersistenceError;
}

type RepositoryError = IListExperimentsRepositoryErrors[keyof IListExperimentsRepositoryErrors];

export const ListExperimentsRepository = createAbstraction<IListExperimentsRepository>(
    "Wb/ListExperimentsRepository"
);

export namespace ListExperimentsRepository {
    export type Interface = IListExperimentsRepository;
    export type Params = IListExperimentsParams;
    export type Return = Promise<Result<WbExperiment[], RepositoryError>>;
    export type Error = RepositoryError;
}

export interface IListExperimentsUseCase {
    execute(params: IListExperimentsParams): Promise<Result<WbExperiment[], UseCaseError>>;
}

export interface IListExperimentsUseCaseErrors {
    notAuthorized: ExperimentNotAuthorizedError;
    persistence: ExperimentPersistenceError;
}

type UseCaseError = IListExperimentsUseCaseErrors[keyof IListExperimentsUseCaseErrors];

/** List experiments for a page. */
export const ListExperimentsUseCase = createAbstraction<IListExperimentsUseCase>(
    "Wb/ListExperimentsUseCase"
);

export namespace ListExperimentsUseCase {
    export type Interface = IListExperimentsUseCase;
    export type Params = IListExperimentsParams;
    export type Return = Promise<Result<WbExperiment[], UseCaseError>>;
    export type Error = UseCaseError;
}
