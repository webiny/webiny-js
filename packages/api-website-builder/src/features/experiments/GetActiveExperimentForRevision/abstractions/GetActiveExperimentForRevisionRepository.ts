import { createAbstraction, type Result } from "@webiny/feature/api";
import type { WbExperiment } from "~/domain/experiment/abstractions.js";
import type {
    ExperimentPersistenceError,
    NoActiveExperimentError
} from "~/domain/experiment/errors.js";

export interface IGetActiveExperimentForRevisionRepository {
    execute(revisionId: string): Promise<Result<WbExperiment, RepositoryError>>;
}

export interface IGetActiveExperimentForRevisionRepositoryErrors {
    noActiveExperiment: NoActiveExperimentError;
    persistence: ExperimentPersistenceError;
}

type RepositoryError =
    IGetActiveExperimentForRevisionRepositoryErrors[keyof IGetActiveExperimentForRevisionRepositoryErrors];

export const GetActiveExperimentForRevisionRepository =
    createAbstraction<IGetActiveExperimentForRevisionRepository>(
        "Wb/GetActiveExperimentForRevisionRepository"
    );

export namespace GetActiveExperimentForRevisionRepository {
    export type Interface = IGetActiveExperimentForRevisionRepository;
    export type Return = Promise<Result<WbExperiment, RepositoryError>>;
    export type Error = RepositoryError;
}
