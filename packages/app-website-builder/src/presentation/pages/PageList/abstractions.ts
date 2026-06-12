import { createAbstraction } from "@webiny/feature/admin";
import type { IListPresenter } from "@webiny/app-admin/presentation/listPresenter/abstractions.js";
import type { IFolderTreePresenter } from "@webiny/app-aco/presentation/folderTree/abstractions.js";
import type { Page } from "~/domain/Page/Page.js";

export interface IPageListInitConfig {
    initialFolderId?: string;
    initialSearch?: string;
}

export interface IPageListViewModel {
    showFolders: boolean;
}

export interface IPageListPresenter {
    readonly vm: IPageListViewModel;
    readonly list: IListPresenter<Page>;
    readonly folders: IFolderTreePresenter;

    deletePage(id: string): Promise<boolean>;
    publishPage(id: string): Promise<boolean>;
    unpublishPage(id: string): Promise<boolean>;
    movePage(id: string, folderId: string): Promise<boolean>;
    duplicatePage(id: string): Promise<boolean>;

    init(config?: IPageListInitConfig): void;
    dispose(): void;
}

export const PageListPresenter = createAbstraction<IPageListPresenter>("PageListPresenter");

export namespace PageListPresenter {
    export type Interface = IPageListPresenter;
    export type ViewModel = IPageListViewModel;
    export type InitConfig = IPageListInitConfig;
}
