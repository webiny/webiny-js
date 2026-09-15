import { createAbstraction, type Result } from "@webiny/feature/api";
import type { WbExperiment } from "~/domain/experiment/abstractions.js";
import type {
    ExperimentNotFoundError,
    ExperimentPersistenceError
} from "~/domain/experiment/errors.js";

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
