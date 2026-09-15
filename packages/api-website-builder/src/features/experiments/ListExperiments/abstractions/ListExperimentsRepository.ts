import { createAbstraction, type Result } from "@webiny/feature/api";
import type { WbExperiment } from "~/domain/experiment/abstractions.js";
import type { ExperimentPersistenceError } from "~/domain/experiment/errors.js";

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
