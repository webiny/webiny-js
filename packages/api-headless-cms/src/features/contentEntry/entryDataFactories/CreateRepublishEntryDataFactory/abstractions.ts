import { createAbstraction } from "@webiny/feature/api";
import type { CmsEntry, CmsEntryValues, CmsModel } from "~/types/index.js";

export interface ICreateRepublishEntryDataResponse<
    TValues extends CmsEntryValues = CmsEntryValues
> {
    entry: CmsEntry<TValues>;
}

export interface ICreateRepublishEntryDataFactory {
    create<TValues extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        originalEntry: CmsEntry<TValues>
    ): Promise<ICreateRepublishEntryDataResponse<TValues>>;
}

export const CreateRepublishEntryDataFactory = createAbstraction<ICreateRepublishEntryDataFactory>(
    "Cms/Entry/CreateRepublishEntryDataFactory"
);

export namespace CreateRepublishEntryDataFactory {
    export type Interface = ICreateRepublishEntryDataFactory;
    export type Response<TValues extends CmsEntryValues = CmsEntryValues> =
        ICreateRepublishEntryDataResponse<TValues>;
}
