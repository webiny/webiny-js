import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { CmsEntryValues, CmsModel } from "~/types/index.js";
import type {
    IListSimpleEntriesParams,
    IListSimpleEntriesResult
} from "~/features/simpleContentEntries/types.js";
import type { SimpleEntryNotAuthorizedError } from "~/features/simpleContentEntries/domain/errors/index.js";
import type { ListSimpleEntriesRepository } from "./ListSimpleEntriesRepository.js";

export interface IListSimpleEntriesUseCase {
    execute<TValues extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        params?: IListSimpleEntriesParams
    ): Promise<Result<IListSimpleEntriesResult<TValues>, UseCaseError>>;
}

export interface IListSimpleEntriesUseCaseErrors {
    notAuthorized: SimpleEntryNotAuthorizedError;
    repository: ListSimpleEntriesRepository.Error;
}

type UseCaseError = IListSimpleEntriesUseCaseErrors[keyof IListSimpleEntriesUseCaseErrors];

/** List simple content entries, paginated by the search backend. */
export const ListSimpleEntriesUseCase = createAbstraction<IListSimpleEntriesUseCase>(
    "Cms/SimpleEntry/ListSimpleEntriesUseCase"
);

export namespace ListSimpleEntriesUseCase {
    export type Interface = IListSimpleEntriesUseCase;
    export type Params = IListSimpleEntriesParams;
    export type Error = UseCaseError;
    export type Return<TValues extends CmsEntryValues = CmsEntryValues> = Promise<
        Result<IListSimpleEntriesResult<TValues>, UseCaseError>
    >;
}
