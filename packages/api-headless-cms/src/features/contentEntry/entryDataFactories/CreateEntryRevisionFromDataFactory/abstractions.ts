import { createAbstraction } from "@webiny/feature/api";
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

export interface ICreateEntryRevisionFromDataFactory {
    create<TValues extends CmsEntryValues = CmsEntryValues>(
        sourceId: string,
        model: CmsModel,
        rawInput: CreateCmsEntryInput<TValues>,
        originalEntry: CmsEntry<TValues>,
        latestStorageEntry: CmsEntry<TValues>,
        options?: CreateCmsEntryOptionsInput
    ): Promise<ICreateEntryRevisionFromDataResponse<TValues>>;
}

export const CreateEntryRevisionFromDataFactory =
    createAbstraction<ICreateEntryRevisionFromDataFactory>(
        "Cms/Entry/CreateEntryRevisionFromDataFactory"
    );

export namespace CreateEntryRevisionFromDataFactory {
    export type Interface = ICreateEntryRevisionFromDataFactory;
    export type Response<TValues extends CmsEntryValues = CmsEntryValues> =
        ICreateEntryRevisionFromDataResponse<TValues>;
}
