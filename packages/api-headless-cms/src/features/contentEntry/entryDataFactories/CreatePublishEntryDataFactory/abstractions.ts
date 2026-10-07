import { createAbstraction, type Result } from "@webiny/feature/api";
import type { GetLatestRevisionByEntryIdUseCase } from "~/features/contentEntry/GetLatestRevisionByEntryId/index.js";
import type { EntryValidationError } from "~/domain/contentEntry/errors.js";
import type { CmsEntry, CmsEntryValues, CmsModel } from "~/types/index.js";

export interface ICreatePublishEntryDataResponse<TValues extends CmsEntryValues = CmsEntryValues> {
    entry: CmsEntry<TValues>;
}

/**
 * Expected failures of building the data of an entry being published.
 */
export interface ICreatePublishEntryDataFactoryErrors {
    latest: GetLatestRevisionByEntryIdUseCase.Error;
    validation: EntryValidationError;
}

type FactoryError =
    ICreatePublishEntryDataFactoryErrors[keyof ICreatePublishEntryDataFactoryErrors];

export interface ICreatePublishEntryDataFactory {
    create<TValues extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        originalEntry: CmsEntry<TValues>
    ): Promise<Result<ICreatePublishEntryDataResponse<TValues>, FactoryError>>;
}

export const CreatePublishEntryDataFactory = createAbstraction<ICreatePublishEntryDataFactory>(
    "Cms/Entry/CreatePublishEntryDataFactory"
);

export namespace CreatePublishEntryDataFactory {
    export type Interface = ICreatePublishEntryDataFactory;
    export type Error = FactoryError;
    export type Return<TValues extends CmsEntryValues = CmsEntryValues> = Result<
        ICreatePublishEntryDataResponse<TValues>,
        FactoryError
    >;
    export type Response<TValues extends CmsEntryValues = CmsEntryValues> =
        ICreatePublishEntryDataResponse<TValues>;
}
