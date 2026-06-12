import { createAbstraction } from "@webiny/feature/admin";
import { FormModel } from "@webiny/app-admin";
import type { CmsContentEntry } from "~/types.js";
import type { CmsModel } from "~/types.js";

export interface IContentEntryFormViewModel {
    loading: string | null;
    entry: CmsContentEntry | null;
    model: CmsModel;
    form: FormModel.FormVM | null;
    canSave: boolean;
    canPublish: boolean;
    canUnpublish: boolean;
    canDelete: boolean;
    isNewEntry: boolean;
    isDirty: boolean;
}

export interface IContentEntryFormPresenter {
    vm: IContentEntryFormViewModel;
    loadRevision(id: string): Promise<void>;
    saveRevision(options?: { skipValidation?: boolean }): Promise<boolean>;
    publishRevision(): Promise<boolean>;
    unpublishRevision(): Promise<boolean>;
    deleteEntry(): Promise<boolean>;
    newEntry(): void;
    reset(): void;
}

export const ContentEntryFormPresenter = createAbstraction<IContentEntryFormPresenter>(
    "ContentEntryFormPresenter"
);

export namespace ContentEntryFormPresenter {
    export type Interface = IContentEntryFormPresenter;
    export type ViewModel = IContentEntryFormViewModel;
}
