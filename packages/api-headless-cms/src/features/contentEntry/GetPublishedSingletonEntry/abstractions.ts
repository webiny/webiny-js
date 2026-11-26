import { createAbstraction, Result } from "@webiny/feature/api";
import type { CmsEntry, CmsEntryValues, CmsModel } from "~/types/index.js";
import type { EntryNotFoundError } from "~/domain/contentEntry/errors.js";
import type { EntryValidationError } from "~/domain/contentEntry/errors.js";
import type { GetPublishedRevisionByEntryIdUseCase } from "~/features/contentEntry/GetPublishedRevisionByEntryId/index.js";
import type { GetRevisionByIdUseCase } from "~/features/contentEntry/GetRevisionById/index.js";
import type { CreateEntryUseCase } from "~/features/contentEntry/CreateEntry/index.js";

/**
 * GetPublishedSingletonEntry Use Case
 *
 * Gets the published revision of the singleton entry, creating it if missing.
 */
export interface IGetPublishedSingletonEntryUseCase {
    execute<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel
    ): Promise<Result<CmsEntry<T>, UseCaseError>>;
}

export interface IGetPublishedSingletonEntryUseCaseErrors {
    notFound: EntryNotFoundError;
    validation: EntryValidationError;
    delegate: GetPublishedRevisionByEntryIdUseCase.Error;
    delegate2: GetRevisionByIdUseCase.Error;
    delegate3: CreateEntryUseCase.Error;
}

type UseCaseError =
    IGetPublishedSingletonEntryUseCaseErrors[keyof IGetPublishedSingletonEntryUseCaseErrors];

/** Gets the published revision of the singleton entry, creating it if missing. */
export const GetPublishedSingletonEntryUseCase =
    createAbstraction<IGetPublishedSingletonEntryUseCase>("GetPublishedSingletonEntryUseCase");

export namespace GetPublishedSingletonEntryUseCase {
    export type Interface = IGetPublishedSingletonEntryUseCase;
    export type Error = UseCaseError;
    export type Return<T extends CmsEntryValues = CmsEntryValues> = Promise<
        Result<CmsEntry<T>, UseCaseError>
    >;
}
