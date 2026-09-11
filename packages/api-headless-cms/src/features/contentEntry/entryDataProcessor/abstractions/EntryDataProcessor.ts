import { createAbstraction } from "@webiny/feature/api";
import type { CmsEntry, CmsEntryValues, CmsModel } from "~/types/index.js";

export interface IEntryDataProcessorValidateParams<
    TValues extends CmsEntryValues = CmsEntryValues
> {
    model: CmsModel;
    values: TValues;
    entry?: CmsEntry<TValues>;
    skipValidation?: boolean;
}

export interface IEntryDataProcessorMapReferenceFieldsParams<
    TValues extends CmsEntryValues = CmsEntryValues
> {
    model: CmsModel;
    values: TValues;
    validateEntries?: boolean;
}

/**
 * The two entry value preparation steps every data factory runs, behind an injectable service so
 * factories do not reach into `~/crud/` directly.
 */
export interface IEntryDataProcessor {
    validateOrThrow<TValues extends CmsEntryValues = CmsEntryValues>(
        params: IEntryDataProcessorValidateParams<TValues>
    ): Promise<void>;
    mapReferenceFields<TValues extends CmsEntryValues = CmsEntryValues>(
        params: IEntryDataProcessorMapReferenceFieldsParams<TValues>
    ): Promise<TValues>;
}

export const EntryDataProcessor = createAbstraction<IEntryDataProcessor>(
    "Cms/Entry/EntryDataProcessor"
);

export namespace EntryDataProcessor {
    export type Interface = IEntryDataProcessor;
    export type ValidateParams<TValues extends CmsEntryValues = CmsEntryValues> =
        IEntryDataProcessorValidateParams<TValues>;
    export type MapReferenceFieldsParams<TValues extends CmsEntryValues = CmsEntryValues> =
        IEntryDataProcessorMapReferenceFieldsParams<TValues>;
}
