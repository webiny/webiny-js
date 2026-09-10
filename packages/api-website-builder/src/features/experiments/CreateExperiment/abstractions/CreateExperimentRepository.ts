import { createAbstraction, type Result } from "@webiny/feature/api";
import type { WbExperiment } from "~/domain/experiment/abstractions.js";
import {
    ExperimentPersistenceError,
    ExperimentValidationError
} from "~/domain/experiment/errors.js";
import type { ICreateExperimentParams } from "./CreateExperimentUseCase.js";

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
