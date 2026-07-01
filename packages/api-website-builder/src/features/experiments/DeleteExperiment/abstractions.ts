import { createAbstraction, type Result } from "@webiny/feature/api";
import type {
    ExperimentNotAuthorizedError,
    ExperimentNotFoundError,
    ExperimentPersistenceError
} from "~/domain/experiment/errors.js";

export interface IDeleteExperimentParams {
    id: string;
}

export interface IDeleteExperimentRepository {
    execute(params: IDeleteExperimentParams): Promise<Result<boolean, RepositoryError>>;
}

export interface IDeleteExperimentRepositoryErrors {
    notFound: ExperimentNotFoundError;
    persistence: ExperimentPersistenceError;
}

type RepositoryError = IDeleteExperimentRepositoryErrors[keyof IDeleteExperimentRepositoryErrors];

export const DeleteExperimentRepository = createAbstraction<IDeleteExperimentRepository>(
    "Wb/DeleteExperimentRepository"
);

export namespace DeleteExperimentRepository {
    export type Interface = IDeleteExperimentRepository;
    export type Params = IDeleteExperimentParams;
    export type Return = Promise<Result<boolean, RepositoryError>>;
    export type Error = RepositoryError;
}

export interface IDeleteExperimentUseCase {
    execute(params: IDeleteExperimentParams): Promise<Result<boolean, UseCaseError>>;
}

export interface IDeleteExperimentUseCaseErrors {
    notAuthorized: ExperimentNotAuthorizedError;
    notFound: ExperimentNotFoundError;
    persistence: ExperimentPersistenceError;
}

type UseCaseError = IDeleteExperimentUseCaseErrors[keyof IDeleteExperimentUseCaseErrors];

/** Delete an experiment. */
export const DeleteExperimentUseCase = createAbstraction<IDeleteExperimentUseCase>(
    "Wb/DeleteExperimentUseCase"
);

export namespace DeleteExperimentUseCase {
    export type Interface = IDeleteExperimentUseCase;
    export type Params = IDeleteExperimentParams;
    export type Return = Promise<Result<boolean, UseCaseError>>;
    export type Error = UseCaseError;
}
