import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { CmsEntryValues, CmsModel } from "~/types/index.js";
import type {
    IGetSimpleEntryParams,
    ISimpleCmsEntry
} from "~/features/simpleContentEntries/types.js";
import type {
    ModelNotSimpleError,
    SimpleEntryNotFoundError,
    SimpleEntryPersistenceError
} from "~/features/simpleContentEntries/domain/errors/index.js";

export interface IGetSimpleEntryRepository {
    execute<TValues extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        params: IGetSimpleEntryParams
    ): Promise<Result<ISimpleCmsEntry<TValues>, RepositoryError>>;
}

export interface IGetSimpleEntryRepositoryErrors {
    notFound: SimpleEntryNotFoundError;
    storage: SimpleEntryPersistenceError;
    modelNotSimple: ModelNotSimpleError;
}

type RepositoryError = IGetSimpleEntryRepositoryErrors[keyof IGetSimpleEntryRepositoryErrors];

/** Reads a single simple entry. */
export const GetSimpleEntryRepository = createAbstraction<IGetSimpleEntryRepository>(
    "Cms/SimpleEntry/GetSimpleEntryRepository"
);

export namespace GetSimpleEntryRepository {
    export type Interface = IGetSimpleEntryRepository;
    export type Error = RepositoryError;
    export type Return<TValues extends CmsEntryValues = CmsEntryValues> = Promise<
        Result<ISimpleCmsEntry<TValues>, RepositoryError>
    >;
}
