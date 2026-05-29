import { createAbstraction } from "@webiny/feature/admin";
import type { IListViewModel } from "@webiny/app-admin/presentation/listPresenter/abstractions.js";
import type { IListActions } from "@webiny/app-admin/presentation/listPresenter/abstractions.js";
import type { IFolderTreeViewModel } from "@webiny/app-aco/presentation/folderTree/abstractions.js";
import type { Redirect } from "~/domain/Redirect/Redirect.js";
import type { ICreateRedirectPresenter } from "~/presentation/redirects/CreateRedirect/abstractions.js";
import type { IEditRedirectPresenter } from "~/presentation/redirects/EditRedirect/abstractions.js";

export interface IRedirectListInitConfig {
    initialFolderId?: string;
}

export interface IRedirectListViewModel {
    list: IListViewModel<Redirect>;
    folders: IFolderTreeViewModel;
    createRedirect: ICreateRedirectPresenter | null;
    editRedirect: IEditRedirectPresenter | null;
    showFolders: boolean;
    showingFilters: boolean;
}

export interface IFolderActions {
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
}

export interface IRedirectListActions extends IListActions {
    showFilters(): void;
    hideFilters(): void;
    showCreateDialog(folderId: string): void;
    showEditDialog(redirectId: string): void;
    hideCreateDialog(): void;
    hideEditDialog(): void;
    folders: IFolderActions;
}

export interface IRedirectListPresenter {
    vm: IRedirectListViewModel;
    actions: IRedirectListActions;
    init(config?: IRedirectListInitConfig): void;
    dispose(): void;
}

export const RedirectListPresenter = createAbstraction<IRedirectListPresenter>(
    "WebsiteBuilder/RedirectListPresenter"
);

export namespace RedirectListPresenter {
    export type Interface = IRedirectListPresenter;
    export type ViewModel = IRedirectListViewModel;
    export type Actions = IRedirectListActions;
    export type InitConfig = IRedirectListInitConfig;
}
