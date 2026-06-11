import { createAbstraction } from "@webiny/feature/admin";
import type { IFormVM } from "@webiny/app-admin/features/formModel/abstractions.js";
import type { CmsContentEntry } from "~/types.js";

export interface ISingletonEntryViewModel {
    loading: string | null;
    entry: CmsContentEntry | null;
    form: IFormVM | null;
    canSave: boolean;
    isDirty: boolean;
}

export interface ISingletonEntryPresenter {
    vm: ISingletonEntryViewModel;
    save(): Promise<boolean>;
    init(): Promise<void>;
    dispose(): void;
}

export const SingletonEntryPresenter =
    createAbstraction<ISingletonEntryPresenter>("SingletonEntryPresenter");

export namespace SingletonEntryPresenter {
    export type Interface = ISingletonEntryPresenter;
    export type ViewModel = ISingletonEntryViewModel;
}
