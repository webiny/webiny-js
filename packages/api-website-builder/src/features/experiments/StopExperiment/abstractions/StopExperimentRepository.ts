import { createAbstraction, type Result } from "@webiny/feature/api";
import type { WbExperiment } from "~/domain/experiment/abstractions.js";
import type {
    ExperimentNotFoundError,
    ExperimentPersistenceError
} from "~/domain/experiment/errors.js";

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
