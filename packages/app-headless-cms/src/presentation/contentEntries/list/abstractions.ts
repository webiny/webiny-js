import { createAbstraction } from "@webiny/feature/admin";
import type {
    IListViewModel,
    IListActions
} from "@webiny/app-admin/presentation/listPresenter/abstractions.js";
import type {
    IFolderTreeViewModel,
    IFolderTreePresenter
} from "@webiny/app-aco/presentation/folderTree/abstractions.js";
import type { CmsContentEntry, CmsModel } from "~/types.js";

export interface IContentEntriesInitConfig {
    modelId: string;
    initialFolderId?: string;
}

export interface IContentEntriesViewModel {
    model: CmsModel | null;
    list: IListViewModel<CmsContentEntry>;
    folders: IFolderTreeViewModel;
    selectedEntryId: string | null;
    showingEntry: boolean;
    showFolders: boolean;
    showingFilters: boolean;
    loading: boolean;
}

export interface IContentEntriesActions extends IListActions {
    selectEntry(id: string): void;
    deselectEntry(): void;
    createEntry(): void;
    bulkAction(action: string, data?: Record<string, unknown>): Promise<void>;
    showFilters(): void;
    hideFilters(): void;
    folders: {
        selectFolder(folderId: string | null): void;
        createFolder(parentFolderId?: string): void;
        editFolder(folderId: string): void;
        deleteFolder(folderId: string): Promise<void>;
        moveFolder(folderId: string, targetParentId: string | null): Promise<void>;
        loadChildFolders(parentIds: string[]): Promise<void>;
        canManageStructure(folderId: string): boolean;
        getAncestorIds(folderId: string): string[];
        submitOperation(): Promise<boolean>;
        cancelOperation(): void;
    };
}

export interface IContentEntriesPresenter {
    vm: IContentEntriesViewModel;
    actions: IContentEntriesActions;
    init(config: IContentEntriesInitConfig): void;
    setModel(model: CmsModel): void;
    dispose(): void;
}

export const ContentEntriesPresenter =
    createAbstraction<IContentEntriesPresenter>("ContentEntriesPresenter");

export namespace ContentEntriesPresenter {
    export type Interface = IContentEntriesPresenter;
    export type ViewModel = IContentEntriesViewModel;
    export type Actions = IContentEntriesActions;
    export type InitConfig = IContentEntriesInitConfig;
}
