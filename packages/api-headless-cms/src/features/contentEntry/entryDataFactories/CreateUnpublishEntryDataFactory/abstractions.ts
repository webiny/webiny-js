import { createAbstraction } from "@webiny/feature/api";
import type { CmsEntry, CmsEntryValues } from "~/types/index.js";

export interface ICreateUnpublishEntryDataResponse<
    TValues extends CmsEntryValues = CmsEntryValues
> {
    entry: CmsEntry<TValues>;
}

export interface ICreateUnpublishEntryDataFactory {
    create<TValues extends CmsEntryValues = CmsEntryValues>(
        originalEntry: CmsEntry<TValues>
    ): Promise<ICreateUnpublishEntryDataResponse<TValues>>;
}

export const CreateUnpublishEntryDataFactory = createAbstraction<ICreateUnpublishEntryDataFactory>(
    "Cms/Entry/CreateUnpublishEntryDataFactory"
);

export namespace CreateUnpublishEntryDataFactory {
    export type Interface = ICreateUnpublishEntryDataFactory;
    export type Response<TValues extends CmsEntryValues = CmsEntryValues> =
        ICreateUnpublishEntryDataResponse<TValues>;
}
