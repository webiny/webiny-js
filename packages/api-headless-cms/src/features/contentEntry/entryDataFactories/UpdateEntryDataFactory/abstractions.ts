import { createAbstraction, type Result } from "@webiny/feature/api";
import type { GetLatestRevisionByEntryIdUseCase } from "~/features/contentEntry/GetLatestRevisionByEntryId/index.js";
import type { EntryValidationError } from "~/domain/contentEntry/errors.js";
import type {
    CmsEntry,
    CmsEntryValues,
    CmsModel,
    UpdateCmsEntryInput,
    UpdateCmsEntryOptionsInput
} from "~/types/index.js";

export interface IUpdateEntryDataResponse<TValues extends CmsEntryValues = CmsEntryValues> {
    entry: CmsEntry<TValues>;
    input: UpdateCmsEntryInput<TValues>;
}

/**
 * Expected failures of building the data of an entry being updated.
 */
export interface IUpdateEntryDataFactoryErrors {
    latest: GetLatestRevisionByEntryIdUseCase.Error;
    validation: EntryValidationError;
}

type FactoryError = IUpdateEntryDataFactoryErrors[keyof IUpdateEntryDataFactoryErrors];

export interface IUpdateEntryDataFactory {
    create<TValues extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        rawInput: UpdateCmsEntryInput<TValues>,
        originalEntry: CmsEntry<TValues>,
        options?: UpdateCmsEntryOptionsInput
    ): Promise<Result<IUpdateEntryDataResponse<TValues>, FactoryError>>;
}

export const UpdateEntryDataFactory = createAbstraction<IUpdateEntryDataFactory>(
    "Cms/Entry/UpdateEntryDataFactory"
);

export namespace UpdateEntryDataFactory {
    export type Interface = IUpdateEntryDataFactory;
    export type Error = FactoryError;
    export type Return<TValues extends CmsEntryValues = CmsEntryValues> = Result<
        IUpdateEntryDataResponse<TValues>,
        FactoryError
    >;
    export type Response<TValues extends CmsEntryValues = CmsEntryValues> =
        IUpdateEntryDataResponse<TValues>;
}
