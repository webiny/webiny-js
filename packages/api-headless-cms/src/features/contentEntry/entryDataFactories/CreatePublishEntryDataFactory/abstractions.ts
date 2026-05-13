import { createAbstraction } from "@webiny/feature/api";
import type { CmsEntry, CmsEntryValues, CmsModel } from "~/types/index.js";

export interface ICreatePublishEntryDataResponse<TValues extends CmsEntryValues = CmsEntryValues> {
    entry: CmsEntry<TValues>;
}

export interface ICreatePublishEntryDataFactory {
    create<TValues extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        originalEntry: CmsEntry<TValues>,
        latestEntry: CmsEntry<TValues>
    ): Promise<ICreatePublishEntryDataResponse<TValues>>;
}

export const CreatePublishEntryDataFactory = createAbstraction<ICreatePublishEntryDataFactory>(
    "Cms/Entry/CreatePublishEntryDataFactory"
);

export namespace CreatePublishEntryDataFactory {
    export type Interface = ICreatePublishEntryDataFactory;
    export type Response<TValues extends CmsEntryValues = CmsEntryValues> =
        ICreatePublishEntryDataResponse<TValues>;
}
