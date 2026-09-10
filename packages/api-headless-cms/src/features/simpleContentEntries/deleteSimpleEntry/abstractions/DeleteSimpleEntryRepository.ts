import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { CmsModel } from "~/types/index.js";
import type { ISimpleCmsEntry } from "~/features/simpleContentEntries/types.js";
import type {
    ModelNotSimpleError,
    SimpleEntryPersistenceError
} from "~/features/simpleContentEntries/domain/errors/index.js";

export interface IDeleteSimpleEntryRepository {
    execute(model: CmsModel, entry: ISimpleCmsEntry): Promise<Result<void, RepositoryError>>;
}

export interface IDeleteSimpleEntryRepositoryErrors {
    storage: SimpleEntryPersistenceError;
    modelNotSimple: ModelNotSimpleError;
}

type RepositoryError = IDeleteSimpleEntryRepositoryErrors[keyof IDeleteSimpleEntryRepositoryErrors];

/** Permanently removes a simple entry. */
export const DeleteSimpleEntryRepository = createAbstraction<IDeleteSimpleEntryRepository>(
    "Cms/SimpleEntry/DeleteSimpleEntryRepository"
);

export namespace DeleteSimpleEntryRepository {
    export type Interface = IDeleteSimpleEntryRepository;
    export type Error = RepositoryError;
    export type Return = Promise<Result<void, RepositoryError>>;
}
