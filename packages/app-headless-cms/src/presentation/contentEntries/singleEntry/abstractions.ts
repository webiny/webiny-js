import { createAbstraction } from "@webiny/feature/admin";
import type { IFormVM } from "@webiny/app-admin/features/formModel/abstractions.js";
import type { CmsContentEntry } from "~/types.js";

export interface ISingleEntryViewModel {
    loading: string | null;
    entry: CmsContentEntry | null;
    form: IFormVM | null;
    canSave: boolean;
    isDirty: boolean;
}

export interface ISingleEntryPresenter {
    vm: ISingleEntryViewModel;
    save(): Promise<boolean>;
    init(): Promise<void>;
    dispose(): void;
}

export const SingleEntryPresenter =
    createAbstraction<ISingleEntryPresenter>("SingleEntryPresenter");

export namespace SingleEntryPresenter {
    export type Interface = ISingleEntryPresenter;
    export type ViewModel = ISingleEntryViewModel;
}
