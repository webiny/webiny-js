import { createAbstraction } from "@webiny/feature/api";
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

export interface IUpdateEntryDataFactory {
    create<TValues extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        rawInput: UpdateCmsEntryInput<TValues>,
        originalEntry: CmsEntry<TValues>,
        options?: UpdateCmsEntryOptionsInput
    ): Promise<IUpdateEntryDataResponse<TValues>>;
}

export const UpdateEntryDataFactory = createAbstraction<IUpdateEntryDataFactory>(
    "Cms/Entry/UpdateEntryDataFactory"
);

export namespace UpdateEntryDataFactory {
    export type Interface = IUpdateEntryDataFactory;
    export type Response<TValues extends CmsEntryValues = CmsEntryValues> =
        IUpdateEntryDataResponse<TValues>;
}
