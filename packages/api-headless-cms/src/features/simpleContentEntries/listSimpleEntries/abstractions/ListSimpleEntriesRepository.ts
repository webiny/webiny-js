import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { CmsEntryValues, CmsModel } from "~/types/index.js";
import type {
    IListSimpleEntriesParams,
    IListSimpleEntriesResult
} from "~/features/simpleContentEntries/types.js";
import type {
    ModelNotSimpleError,
    SimpleEntryPersistenceError
} from "~/features/simpleContentEntries/domain/errors/index.js";

export interface IListSimpleEntriesRepository {
    execute<TValues extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        params: IListSimpleEntriesParams
    ): Promise<Result<IListSimpleEntriesResult<TValues>, RepositoryError>>;
}

export interface IListSimpleEntriesRepositoryErrors {
    storage: SimpleEntryPersistenceError;
    modelNotSimple: ModelNotSimpleError;
}

type RepositoryError = IListSimpleEntriesRepositoryErrors[keyof IListSimpleEntriesRepositoryErrors];

/** Reads a page of simple entries. */
export const ListSimpleEntriesRepository = createAbstraction<IListSimpleEntriesRepository>(
    "Cms/SimpleEntry/ListSimpleEntriesRepository"
);

export namespace ListSimpleEntriesRepository {
    export type Interface = IListSimpleEntriesRepository;
    export type Error = RepositoryError;
    export type Return<TValues extends CmsEntryValues = CmsEntryValues> = Promise<
        Result<IListSimpleEntriesResult<TValues>, RepositoryError>
    >;
}
