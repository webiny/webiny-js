import { createAbstraction } from "@webiny/feature/admin";
import type { IFormVM } from "@webiny/app-admin/features/formModel/abstractions.js";
import type { CmsContentEntry, CmsContentEntryRevision, CmsModel } from "~/types.js";

export interface IContentEntryFormInitConfig {
    model: CmsModel;
    entryId?: string;
}

export interface IContentEntryFormViewModel {
    loading: string | null;
    entry: CmsContentEntry | null;
    form: IFormVM | null;
    revisions: CmsContentEntryRevision[];
    activeTab: string;
    canSave: boolean;
    canPublish: boolean;
    canUnpublish: boolean;
    canDelete: boolean;
    canCreateRevision: boolean;
    isNewEntry: boolean;
    isDirty: boolean;
}

export interface IContentEntryFormActions {
    save(): Promise<boolean>;
    publish(): Promise<boolean>;
    unpublish(): Promise<boolean>;
    deleteEntry(): Promise<boolean>;
    deleteRevision(): Promise<boolean>;
    createRevision(): Promise<void>;
    switchRevision(revisionId: string): Promise<void>;
    setActiveTab(tab: string): void;
    updateRevisionDescription(description: string): Promise<boolean>;
}

export interface IContentEntryFormPresenter {
    vm: IContentEntryFormViewModel;
    actions: IContentEntryFormActions;
    loadEntry(config: IContentEntryFormInitConfig): Promise<void>;
    newEntry(config: { model: CmsModel }): void;
    dispose(): void;
}

export const ContentEntryFormPresenter = createAbstraction<IContentEntryFormPresenter>(
    "ContentEntryFormPresenter"
);

export namespace ContentEntryFormPresenter {
    export type Interface = IContentEntryFormPresenter;
    export type ViewModel = IContentEntryFormViewModel;
    export type Actions = IContentEntryFormActions;
    export type InitConfig = IContentEntryFormInitConfig;
}
