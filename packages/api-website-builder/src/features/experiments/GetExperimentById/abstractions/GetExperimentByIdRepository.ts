import { createAbstraction, type Result } from "@webiny/feature/api";
import type { WbExperiment } from "~/domain/experiment/abstractions.js";
import type {
    ExperimentNotFoundError,
    ExperimentPersistenceError
} from "~/domain/experiment/errors.js";

export interface IGetExperimentByIdRepository {
    execute(id: string): Promise<Result<WbExperiment, RepositoryError>>;
}

export interface IGetExperimentByIdRepositoryErrors {
    notFound: ExperimentNotFoundError;
    persistence: ExperimentPersistenceError;
}

type RepositoryError = IGetExperimentByIdRepositoryErrors[keyof IGetExperimentByIdRepositoryErrors];

export const GetExperimentByIdRepository = createAbstraction<IGetExperimentByIdRepository>(
    "Wb/GetExperimentByIdRepository"
);

export namespace GetExperimentByIdRepository {
    export type Interface = IGetExperimentByIdRepository;
    export type Return = Promise<Result<WbExperiment, RepositoryError>>;
    export type Error = RepositoryError;
}
