import { createAbstraction } from "@webiny/feature/admin";
import type { IFormVM } from "@webiny/app-admin/features/formModel/abstractions.js";
import type { CmsContentEntry } from "~/types.js";
import type { CmsModel } from "~/types.js";

export interface IContentEntryFormViewModel {
    loading: string | null;
    entry: CmsContentEntry | null;
    model: CmsModel;
    form: IFormVM | null;
    canSave: boolean;
    canPublish: boolean;
    canUnpublish: boolean;
    canDelete: boolean;
    isNewEntry: boolean;
    isDirty: boolean;
}

export interface IContentEntryFormPresenter {
    vm: IContentEntryFormViewModel;
    save(): Promise<boolean>;
    publish(): Promise<boolean>;
    unpublish(): Promise<boolean>;
    deleteEntry(): Promise<boolean>;
    updateRevisionDescription(description: string): Promise<boolean>;
    loadEntry(entryId: string): Promise<void>;
    newEntry(): void;
    dispose(): void;
}

export const ContentEntryFormPresenter = createAbstraction<IContentEntryFormPresenter>(
    "ContentEntryFormPresenter"
);

export namespace ContentEntryFormPresenter {
    export type Interface = IContentEntryFormPresenter;
    export type ViewModel = IContentEntryFormViewModel;
}
