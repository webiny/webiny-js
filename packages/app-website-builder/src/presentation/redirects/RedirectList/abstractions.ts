import { createAbstraction } from "@webiny/feature/admin";
import type { IListViewModel } from "@webiny/app-admin/presentation/listPresenter/abstractions.js";
import type { IListActions } from "@webiny/app-admin/presentation/listPresenter/abstractions.js";
import type { IWorkerActions } from "@webiny/app-admin";
import type { IFormVM } from "@webiny/app-admin/features/formModel/abstractions.js";
import type { IFolderTreeViewModel } from "@webiny/app-aco/presentation/folderTree/abstractions.js";
import type { FolderDto } from "@webiny/app-aco";
import type { Redirect } from "~/domain/Redirect/Redirect.js";
import type { RedirectDto } from "~/domain/Redirect/RedirectDto.js";

// Create Redirect
export interface ICreateRedirectViewModel {
    loading: string | null;
    form: IFormVM;
}

export interface ICreateRedirectPresenter {
    vm: ICreateRedirectViewModel;
    init(folderId: string): void;
    save(): Promise<boolean>;
}

export const CreateRedirectPresenter = createAbstraction<ICreateRedirectPresenter>(
    "WebsiteBuilder/CreateRedirectPresenter"
);

export namespace CreateRedirectPresenter {
    export type Interface = ICreateRedirectPresenter;
    export type ViewModel = ICreateRedirectViewModel;
}

// Edit Redirect
export interface IEditRedirectViewModel {
    redirect: RedirectDto | null;
    loading: string | null;
    form: IFormVM;
}

export interface IEditRedirectPresenter {
    vm: IEditRedirectViewModel;
    loadRedirect(redirectId: string): Promise<void>;
    save(): Promise<boolean>;
}

export const EditRedirectPresenter = createAbstraction<IEditRedirectPresenter>(
    "WebsiteBuilder/EditRedirectPresenter"
);

export namespace EditRedirectPresenter {
    export type Interface = IEditRedirectPresenter;
    export type ViewModel = IEditRedirectViewModel;
}

// List
export interface IRedirectListInitConfig {
    initialFolderId?: string;
}

export interface IRedirectListViewModel {
    list: IListViewModel<Redirect>;
    folders: IFolderTreeViewModel;
    createRedirect: ICreateRedirectPresenter | null;
    editRedirect: IEditRedirectPresenter | null;
    showFolders: boolean;
    childFolders: FolderDto[];
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
    worker: IWorkerActions<Redirect>;
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
