import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { CmsEntryValues, CmsModel } from "~/types/index.js";
import type { ISimpleCmsEntry } from "~/features/simpleContentEntries/types.js";
import type {
    ModelNotSimpleError,
    SimpleEntryPersistenceError
} from "~/features/simpleContentEntries/domain/errors/index.js";

export interface IUpdateSimpleEntryRepository {
    execute<TValues extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        entry: ISimpleCmsEntry<TValues>
    ): Promise<Result<void, RepositoryError>>;
}

export interface IUpdateSimpleEntryRepositoryErrors {
    storage: SimpleEntryPersistenceError;
    modelNotSimple: ModelNotSimpleError;
}

type RepositoryError = IUpdateSimpleEntryRepositoryErrors[keyof IUpdateSimpleEntryRepositoryErrors];

/** Persists changes to an existing simple entry. */
export const UpdateSimpleEntryRepository = createAbstraction<IUpdateSimpleEntryRepository>(
    "Cms/SimpleEntry/UpdateSimpleEntryRepository"
);

export namespace UpdateSimpleEntryRepository {
    export type Interface = IUpdateSimpleEntryRepository;
    export type Error = RepositoryError;
    export type Return = Promise<Result<void, RepositoryError>>;
}
