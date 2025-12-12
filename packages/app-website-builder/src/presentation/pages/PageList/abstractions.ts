import type { FolderDto } from "@webiny/app-aco/domain/folder/FolderDto.js";
import { createAbstraction } from "@webiny/feature/admin";
import type { ColumnSorting } from "@webiny/app-utils";
import type { PageDto } from "~/domain/Page/index.js";

export interface IDocumentListPresenterInit {
    folderId: string;
}

export interface IDocumentListVm {
    folderId: string;
    title: string | undefined;
    data: PageDto[];
    folders: FolderDto[];
    selected: any[];
    meta: { totalCount: number; currentCount: number };
    sorting: ColumnSorting[];
    searchQuery: string;
    searchLabel: string;
    isSearch: boolean;
    isEmpty: boolean;
    isRoot: boolean;
    isLoading: boolean;
    isLoadingMore: boolean;
    isFilterVisible: boolean;
}

export interface IDocumentListPresenter {
    init(params: IDocumentListPresenterInit): void;
    showFilters(show: boolean): void;
    vm: IDocumentListVm;
}

export const PageListPresenter = createAbstraction<IDocumentListPresenter>("PageListPresenter");

export namespace PageListPresenter {
    export type Interface = IDocumentListPresenter;
    export type Init = IDocumentListPresenterInit;
    export type ViewModel = IDocumentListVm;
}
