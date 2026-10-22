import { createAbstraction, type Result } from "@webiny/feature/api";
import type { GetLatestRevisionByEntryIdUseCase } from "~/features/contentEntry/GetLatestRevisionByEntryId/index.js";
import type { EntryValidationError } from "~/domain/contentEntry/errors.js";
import type { NotAuthorizedError } from "~/utils/errors.js";
import type {
    CmsEntry,
    CmsEntryValues,
    CmsModel,
    CreateCmsEntryInput,
    CreateCmsEntryOptionsInput
} from "~/types/index.js";

export interface ICreateEntryRevisionFromDataResponse<
    TValues extends CmsEntryValues = CmsEntryValues
> {
    entry: CmsEntry<TValues>;
    input: CreateCmsEntryInput<TValues>;
}

/**
 * Expected failures of building the data of a new entry revision.
 */
export interface ICreateEntryRevisionFromDataFactoryErrors {
    latest: GetLatestRevisionByEntryIdUseCase.Error;
    validation: EntryValidationError;
    notAuthorized: NotAuthorizedError;
}

type FactoryError =
    ICreateEntryRevisionFromDataFactoryErrors[keyof ICreateEntryRevisionFromDataFactoryErrors];

export interface ICreateEntryRevisionFromDataFactory {
    create<TValues extends CmsEntryValues = CmsEntryValues>(
        sourceId: string,
        model: CmsModel,
        rawInput: CreateCmsEntryInput<TValues>,
        originalEntry: CmsEntry<TValues>,
        options?: CreateCmsEntryOptionsInput
    ): Promise<Result<ICreateEntryRevisionFromDataResponse<TValues>, FactoryError>>;
}

export const CreateEntryRevisionFromDataFactory =
    createAbstraction<ICreateEntryRevisionFromDataFactory>(
        "Cms/Entry/CreateEntryRevisionFromDataFactory"
    );

export namespace CreateEntryRevisionFromDataFactory {
    export type Interface = ICreateEntryRevisionFromDataFactory;
    export type Error = FactoryError;
    export type Return<TValues extends CmsEntryValues = CmsEntryValues> = Result<
        ICreateEntryRevisionFromDataResponse<TValues>,
        FactoryError
    >;
    export type Response<TValues extends CmsEntryValues = CmsEntryValues> =
        ICreateEntryRevisionFromDataResponse<TValues>;
}
