import { createAbstraction } from "@webiny/feature/api";
import type {
    CmsEntry,
    CmsEntryValues,
    CmsModel,
    CreateCmsEntryInput,
    CreateCmsEntryOptionsInput
} from "~/types/index.js";

export interface ICreateEntryDataResponse<TValues extends CmsEntryValues = CmsEntryValues> {
    entry: CmsEntry<TValues>;
    input: CreateCmsEntryInput<TValues>;
}

export interface ICreateEntryDataFactory {
    create<TValues extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        rawInput: CreateCmsEntryInput<TValues>,
        options?: CreateCmsEntryOptionsInput
    ): Promise<ICreateEntryDataResponse<TValues>>;
}

export const CreateEntryDataFactory = createAbstraction<ICreateEntryDataFactory>(
    "Cms/Entry/CreateEntryDataFactory"
);

export namespace CreateEntryDataFactory {
    export type Interface = ICreateEntryDataFactory;
    export type Response<TValues extends CmsEntryValues = CmsEntryValues> =
        ICreateEntryDataResponse<TValues>;
}
