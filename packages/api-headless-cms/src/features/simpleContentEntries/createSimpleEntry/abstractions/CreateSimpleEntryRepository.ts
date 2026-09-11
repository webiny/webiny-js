import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { CmsModel } from "~/types/index.js";
import type { ISimpleCmsEntry } from "~/features/simpleContentEntries/types.js";
import type {
    ModelNotSimpleError,
    SimpleEntryPersistenceError
} from "~/features/simpleContentEntries/domain/errors/index.js";

export interface ICreateSimpleEntryRepository {
    execute(model: CmsModel, entry: ISimpleCmsEntry): Promise<Result<void, RepositoryError>>;
}

export interface ICreateSimpleEntryRepositoryErrors {
    storage: SimpleEntryPersistenceError;
    modelNotSimple: ModelNotSimpleError;
}

type RepositoryError = ICreateSimpleEntryRepositoryErrors[keyof ICreateSimpleEntryRepositoryErrors];

/** Persists a new simple entry. */
export const CreateSimpleEntryRepository = createAbstraction<ICreateSimpleEntryRepository>(
    "Cms/SimpleEntry/CreateSimpleEntryRepository"
);

export namespace CreateSimpleEntryRepository {
    export type Interface = ICreateSimpleEntryRepository;
    export type Error = RepositoryError;
    export type Return = Promise<Result<void, RepositoryError>>;
}
