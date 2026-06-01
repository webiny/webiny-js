import { createAbstraction } from "@webiny/feature/admin";
import type {
    IListViewModel,
    IListActions
} from "@webiny/app-admin/presentation/listPresenter/abstractions.js";
import type { IFolderTreeViewModel } from "@webiny/app-aco/presentation/folderTree/abstractions.js";
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
    loading: boolean;
}

export interface IContentEntriesActions {
    search: IListActions["search"];
    sort: IListActions["sort"];
    filter: IListActions["filter"];
    selection: IListActions["selection"];
    loadMore(): Promise<void>;
    refresh(): Promise<void>;
    selectEntry(id: string): void;
    deselectEntry(): void;
    createEntry(): void;
    bulkAction(action: string, data?: Record<string, unknown>): Promise<void>;
}

export interface IContentEntriesPresenter {
    vm: IContentEntriesViewModel;
    actions: IContentEntriesActions;
    init(config: IContentEntriesInitConfig): void;
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
