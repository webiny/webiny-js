import { createAbstraction } from "@webiny/feature/admin";
import type { IListPresenter } from "@webiny/app-admin/presentation/listPresenter/abstractions.js";
import type { IFolderTreePresenter } from "@webiny/app-aco/presentation/folderTree/abstractions.js";
import type { FolderDto } from "@webiny/app-aco";
import type { CmsContentEntry, CmsModel } from "~/types.js";

export interface IContentEntriesInitConfig {
    initialFolderId?: string;
    initialSearch?: string;
    filterNames?: string[];
}

export interface IContentEntriesViewModel {
    model: CmsModel;
    selectedEntryId: string | null;
    showingEntry: boolean;
    showFolders: boolean;
    childFolders: FolderDto[];
}

export interface IContentEntriesPresenter {
    readonly vm: IContentEntriesViewModel;
    readonly list: IListPresenter<CmsContentEntry>;
    readonly folders: IFolderTreePresenter;

    selectEntry(id: string): void;
    deselectEntry(): void;
    createEntry(): void;
    deleteEntry(id: string): Promise<boolean>;
    publishEntry(id: string): Promise<boolean>;
    unpublishEntry(id: string): Promise<boolean>;
    moveEntry(id: string, folderId: string): Promise<boolean>;

    init(config?: IContentEntriesInitConfig): void;
    dispose(): void;
}

export const ContentEntriesPresenter =
    createAbstraction<IContentEntriesPresenter>("ContentEntriesPresenter");

export namespace ContentEntriesPresenter {
    export type Interface = IContentEntriesPresenter;
    export type ViewModel = IContentEntriesViewModel;
    export type InitConfig = IContentEntriesInitConfig;
}
