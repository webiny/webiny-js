import { createAbstraction } from "@webiny/feature/api";
import type { CmsEntry, CmsEntryValues, CmsModel } from "@webiny/api-headless-cms/types/index.js";

export interface SetValuesCb<T extends CmsEntryValues = CmsEntryValues> {
    (prev: T): T;
}

export interface ModifyValuesParams<T extends CmsEntryValues = CmsEntryValues> {
    model: CmsModel;
    entry: CmsEntry<T>;
    values: T;
    setValues: (cb: SetValuesCb<T>) => void;
}

export interface ICmsEntryOpenSearchValuesModifier {
    canModify(modelId: string): boolean;
    modify<T extends CmsEntryValues = CmsEntryValues>(params: {
        model: CmsModel;
        entry: CmsEntry<T>;
        values: T;
    }): T;
}

export const CmsEntryOpenSearchValuesModifier =
    createAbstraction<ICmsEntryOpenSearchValuesModifier>("Cms/Entry/OpenSearch/ValuesModifier");

export namespace CmsEntryOpenSearchValuesModifier {
    export type Interface = ICmsEntryOpenSearchValuesModifier;
    export type Params<T extends CmsEntryValues = CmsEntryValues> = ModifyValuesParams<T>;
}
