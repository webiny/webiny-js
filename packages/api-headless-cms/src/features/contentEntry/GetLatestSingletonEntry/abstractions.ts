import { createAbstraction, Result } from "@webiny/feature/api";
import type { CmsEntry, CmsEntryValues, CmsModel } from "~/types/index.js";
import type { EntryNotFoundError } from "~/domain/contentEntry/errors.js";
import type { EntryValidationError } from "~/domain/contentEntry/errors.js";
import type { GetLatestRevisionByEntryIdUseCase } from "~/features/contentEntry/GetLatestRevisionByEntryId/index.js";
import type { GetRevisionByIdUseCase } from "~/features/contentEntry/GetRevisionById/index.js";
import type { CreateEntryUseCase } from "~/features/contentEntry/CreateEntry/index.js";

/**
 * GetLatestSingletonEntry Use Case
 *
 * Gets the latest revision of the singleton entry, creating it if missing.
 */
export interface IGetLatestSingletonEntryUseCase {
    execute<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel
    ): Promise<Result<CmsEntry<T>, UseCaseError>>;
}

export interface IGetLatestSingletonEntryUseCaseErrors {
    notFound: EntryNotFoundError;
    validation: EntryValidationError;
    delegate: GetLatestRevisionByEntryIdUseCase.Error;
    delegate2: GetRevisionByIdUseCase.Error;
    delegate3: CreateEntryUseCase.Error;
}

type UseCaseError =
    IGetLatestSingletonEntryUseCaseErrors[keyof IGetLatestSingletonEntryUseCaseErrors];

/** Gets the latest revision of the singleton entry, creating it if missing. */
export const GetLatestSingletonEntryUseCase = createAbstraction<IGetLatestSingletonEntryUseCase>(
    "GetLatestSingletonEntryUseCase"
);

export namespace GetLatestSingletonEntryUseCase {
    export type Interface = IGetLatestSingletonEntryUseCase;
    export type Error = UseCaseError;
    export type Return<T extends CmsEntryValues = CmsEntryValues> = Promise<
        Result<CmsEntry<T>, UseCaseError>
    >;
}
