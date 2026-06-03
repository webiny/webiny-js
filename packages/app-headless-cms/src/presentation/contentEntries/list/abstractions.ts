import { createAbstraction } from "@webiny/feature/admin";
import type { IListPresenter } from "@webiny/app-admin/presentation/listPresenter/abstractions.js";
import type { IFolderTreePresenter } from "@webiny/app-aco/presentation/folderTree/abstractions.js";
import type { CmsContentEntry, CmsModel } from "~/types.js";

export interface IContentEntriesInitConfig {
    modelId: string;
    initialFolderId?: string;
}

export interface IContentEntriesViewModel {
    model: CmsModel | null;
    selectedEntryId: string | null;
    showingEntry: boolean;
    showFolders: boolean;
    loading: boolean;
}

export interface IContentEntriesPresenter {
    readonly vm: IContentEntriesViewModel;
    readonly listPresenter: IListPresenter<CmsContentEntry>;
    readonly foldersPresenter: IFolderTreePresenter;

    selectEntry(id: string): void;
    deselectEntry(): void;
    createEntry(): void;
    deleteEntry(id: string): Promise<boolean>;
    publishEntry(id: string): Promise<boolean>;
    unpublishEntry(id: string): Promise<boolean>;
    bulkAction(action: string, data?: Record<string, unknown>): Promise<void>;

    init(config: IContentEntriesInitConfig): void;
    setModel(model: CmsModel): void;
    dispose(): void;
}

export const ContentEntriesPresenter =
    createAbstraction<IContentEntriesPresenter>("ContentEntriesPresenter");

export namespace ContentEntriesPresenter {
    export type Interface = IContentEntriesPresenter;
    export type ViewModel = IContentEntriesViewModel;
    export type InitConfig = IContentEntriesInitConfig;
}
