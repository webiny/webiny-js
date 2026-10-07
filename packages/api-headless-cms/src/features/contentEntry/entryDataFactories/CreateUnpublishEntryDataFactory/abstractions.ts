import { createAbstraction, type Result } from "@webiny/feature/api";
import type { GetLatestRevisionByEntryIdUseCase } from "~/features/contentEntry/GetLatestRevisionByEntryId/index.js";
import type { CmsEntry, CmsEntryValues, CmsModel } from "~/types/index.js";

export interface ICreateUnpublishEntryDataResponse<
    TValues extends CmsEntryValues = CmsEntryValues
> {
    entry: CmsEntry<TValues>;
}

/**
 * Expected failures of building the data of an entry being unpublished.
 */
export interface ICreateUnpublishEntryDataFactoryErrors {
    latest: GetLatestRevisionByEntryIdUseCase.Error;
}

type FactoryError =
    ICreateUnpublishEntryDataFactoryErrors[keyof ICreateUnpublishEntryDataFactoryErrors];

export interface ICreateUnpublishEntryDataFactory {
    create<TValues extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        originalEntry: CmsEntry<TValues>
    ): Promise<Result<ICreateUnpublishEntryDataResponse<TValues>, FactoryError>>;
}

export const CreateUnpublishEntryDataFactory = createAbstraction<ICreateUnpublishEntryDataFactory>(
    "Cms/Entry/CreateUnpublishEntryDataFactory"
);

export namespace CreateUnpublishEntryDataFactory {
    export type Interface = ICreateUnpublishEntryDataFactory;
    export type Error = FactoryError;
    export type Return<TValues extends CmsEntryValues = CmsEntryValues> = Result<
        ICreateUnpublishEntryDataResponse<TValues>,
        FactoryError
    >;
    export type Response<TValues extends CmsEntryValues = CmsEntryValues> =
        ICreateUnpublishEntryDataResponse<TValues>;
}
