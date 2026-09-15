import { createAbstraction, type Result } from "@webiny/feature/api";
import type { WbExperiment } from "~/domain/experiment/abstractions.js";
import type {
    ExperimentPersistenceError,
    NoActiveExperimentError
} from "~/domain/experiment/errors.js";

// Repository: reads the published, running experiment for a page. Fails with
// NoActiveExperimentError when there is none.

export interface IGetActiveExperimentForPathRepository {
    execute(pageEntryId: string): Promise<Result<WbExperiment, RepositoryError>>;
}

export interface IGetActiveExperimentForPathRepositoryErrors {
    noActiveExperiment: NoActiveExperimentError;
    persistence: ExperimentPersistenceError;
}

type RepositoryError =
    IGetActiveExperimentForPathRepositoryErrors[keyof IGetActiveExperimentForPathRepositoryErrors];

export const GetActiveExperimentForPathRepository =
    createAbstraction<IGetActiveExperimentForPathRepository>(
        "Wb/GetActiveExperimentForPathRepository"
    );

export namespace GetActiveExperimentForPathRepository {
    export type Interface = IGetActiveExperimentForPathRepository;
    export type Return = Promise<Result<WbExperiment, RepositoryError>>;
    export type Error = RepositoryError;
}
