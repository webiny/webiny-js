import { createAbstraction } from "@webiny/feature/admin";
import type { IFormVM } from "@webiny/app-admin/features/formModel/abstractions.js";
import type { CmsContentEntry, CmsModel } from "~/types.js";

export interface ISingletonEntryInitConfig {
    model: CmsModel;
}

export interface ISingletonEntryViewModel {
    loading: string | null;
    entry: CmsContentEntry | null;
    form: IFormVM | null;
    canSave: boolean;
    isDirty: boolean;
}

export interface ISingletonEntryActions {
    save(): Promise<boolean>;
}

export interface ISingletonEntryPresenter {
    vm: ISingletonEntryViewModel;
    actions: ISingletonEntryActions;
    init(config: ISingletonEntryInitConfig): Promise<void>;
    dispose(): void;
}

export const SingletonEntryPresenter =
    createAbstraction<ISingletonEntryPresenter>("SingletonEntryPresenter");

export namespace SingletonEntryPresenter {
    export type Interface = ISingletonEntryPresenter;
    export type ViewModel = ISingletonEntryViewModel;
    export type Actions = ISingletonEntryActions;
    export type InitConfig = ISingletonEntryInitConfig;
}
