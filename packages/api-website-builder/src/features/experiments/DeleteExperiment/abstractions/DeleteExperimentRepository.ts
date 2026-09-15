import { createAbstraction, type Result } from "@webiny/feature/api";
import type {
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
