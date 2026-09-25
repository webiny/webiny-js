import { createAbstraction, type Result } from "@webiny/feature/api";
import type { GetLatestRevisionByEntryIdUseCase } from "~/features/contentEntry/GetLatestRevisionByEntryId/index.js";
import type { CmsEntry, CmsEntryValues, CmsModel } from "~/types/index.js";

export interface ICreateRepublishEntryDataResponse<
    TValues extends CmsEntryValues = CmsEntryValues
> {
    entry: CmsEntry<TValues>;
}

/**
 * Expected failures of building the data of an entry being republished.
 */
export interface ICreateRepublishEntryDataFactoryErrors {
    latest: GetLatestRevisionByEntryIdUseCase.Error;
}

type FactoryError =
    ICreateRepublishEntryDataFactoryErrors[keyof ICreateRepublishEntryDataFactoryErrors];

export interface ICreateRepublishEntryDataFactory {
    create<TValues extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        originalEntry: CmsEntry<TValues>
    ): Promise<Result<ICreateRepublishEntryDataResponse<TValues>, FactoryError>>;
}

export const CreateRepublishEntryDataFactory = createAbstraction<ICreateRepublishEntryDataFactory>(
    "Cms/Entry/CreateRepublishEntryDataFactory"
);

export namespace CreateRepublishEntryDataFactory {
    export type Interface = ICreateRepublishEntryDataFactory;
    export type Error = FactoryError;
    export type Return<TValues extends CmsEntryValues = CmsEntryValues> = Result<
        ICreateRepublishEntryDataResponse<TValues>,
        FactoryError
    >;
    export type Response<TValues extends CmsEntryValues = CmsEntryValues> =
        ICreateRepublishEntryDataResponse<TValues>;
}
