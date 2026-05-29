import { makeAutoObservable, reaction, computed } from "mobx";
import { ListPresenter } from "@webiny/app-admin/presentation/listPresenter/abstractions.js";
import { FolderTreePresenter } from "@webiny/app-aco/presentation/folderTree/abstractions.js";
import { GetDescendantFoldersUseCase } from "@webiny/app-aco/features/folders/getDescendantFolders/abstractions.js";
import { ListRedirectsUseCase } from "~/features/redirects/listRedirects/abstractions.js";
import { RedirectsListCache } from "~/features/redirects/shared/abstractions.js";
import {
    RedirectListPresenter as Abstraction,
    type IRedirectListPresenter,
    type IRedirectListViewModel,
    type IRedirectListActions,
    type IRedirectListInitConfig,
    CreateRedirectPresenter
} from "./abstractions.js";
import { RedirectListDataSource } from "./RedirectListDataSource.js";
import type { Redirect } from "~/domain/Redirect/Redirect.js";
import { EditRedirectPresenter } from "./abstractions.js";

class RedirectListPresenterImpl implements IRedirectListPresenter {
    private _showingFilters = false;
    private _disposeReaction: (() => void) | null = null;
    private _createRedirect: CreateRedirectPresenter.Interface | null = null;
    private _editRedirect: EditRedirectPresenter.Interface | null = null;

    constructor(
        private listPresenter: ListPresenter.Interface<Redirect>,
        private folderTreePresenter: FolderTreePresenter.Interface,
        private createRedirectPresenter: CreateRedirectPresenter.Interface,
        private editRedirectPresenter: EditRedirectPresenter.Interface,
        private listRedirectsUseCase: ListRedirectsUseCase.Interface,
        private redirectsListCache: RedirectsListCache.Interface,
        private getDescendantFoldersUseCase: GetDescendantFoldersUseCase.Interface
    ) {
        makeAutoObservable<RedirectListPresenterImpl, "_disposeReaction">(this, {
            _disposeReaction: false,
            vm: computed
        });
    }

    get vm(): IRedirectListViewModel {
        return {
            list: this.listPresenter.vm,
            folders: this.folderTreePresenter.vm,
            createRedirect: this._createRedirect,
            editRedirect: this._editRedirect,
            showFolders: this.shouldShowFolders(),
            showingFilters: this._showingFilters
        };
    }

    actions: IRedirectListActions = {
        search: {
            set: (query: string) => this.listPresenter.actions.search.set(query),
            clear: () => this.listPresenter.actions.search.clear()
        },
        sort: {
            set: (field: string, direction: "ASC" | "DESC") =>
                this.listPresenter.actions.sort.set(field, direction),
            toggle: (field: string) => this.listPresenter.actions.sort.toggle(field)
        },
        filter: {
            set: (key: string, value: unknown) => this.listPresenter.actions.filter.set(key, value),
            clear: (key: string) => this.listPresenter.actions.filter.clear(key),
            clearAll: () => this.listPresenter.actions.filter.clearAll()
        },
        selection: {
            toggle: (id: string) => this.listPresenter.actions.selection.toggle(id),
            selectRangeTo: (id: string) => this.listPresenter.actions.selection.selectRangeTo(id),
            selectAll: () => this.listPresenter.actions.selection.selectAll(),
            deselectAll: () => this.listPresenter.actions.selection.deselectAll(),
            selectRows: (ids: string[]) => this.listPresenter.actions.selection.selectRows(ids),
            isSelected: (id: string) => this.listPresenter.actions.selection.isSelected(id)
        },
        loadMore: () => this.listPresenter.actions.loadMore(),
        refresh: () => this.listPresenter.actions.refresh(),
        showFilters: () => {
            this._showingFilters = true;
        },
        hideFilters: () => {
            this._showingFilters = false;
        },
        showCreateDialog: (folderId: string) => {
            this._createRedirect = this.createRedirectPresenter;
            this.createRedirectPresenter.init(folderId);
        },
        showEditDialog: (redirectId: string) => {
            this._editRedirect = this.editRedirectPresenter;
            void this.editRedirectPresenter.loadRedirect(redirectId);
        },
        hideCreateDialog: () => {
            this._createRedirect = null;
        },
        hideEditDialog: () => {
            this._editRedirect = null;
        },
        folders: {
            selectFolder: (folderId: string | null) => {
                this.listPresenter.actions.search.clear();
                this.folderTreePresenter.selectFolder(folderId);
            },
            createFolder: (parentFolderId?: string) =>
                this.folderTreePresenter.createFolder(parentFolderId),
            editFolder: (folderId: string) => this.folderTreePresenter.editFolder(folderId),
            deleteFolder: (folderId: string) => this.folderTreePresenter.deleteFolder(folderId),
            moveFolder: (folderId: string, targetParentId: string | null) =>
                this.folderTreePresenter.moveFolder(folderId, targetParentId),
            loadChildFolders: (parentIds: string[]) =>
                this.folderTreePresenter.loadChildFolders(parentIds),
            canManageStructure: (folderId: string) =>
                this.folderTreePresenter.canManageStructure(folderId),
            getAncestorIds: (folderId: string) => this.folderTreePresenter.getAncestorIds(folderId),
            submitOperation: () => this.folderTreePresenter.submitOperation(),
            cancelOperation: () => this.folderTreePresenter.cancelOperation()
        }
    };

    init(config?: IRedirectListInitConfig): void {
        const initialFolderId = config?.initialFolderId ?? "root";

        const dataSource = new RedirectListDataSource(
            this.listRedirectsUseCase,
            this.redirectsListCache,
            this.getDescendantFoldersUseCase
        );

        this.listPresenter.init({
            dataSource,
            initialSort: { field: "createdOn", direction: "DESC" },
            initialFilters: { folderId: initialFolderId },
            limit: 50
        });

        if (initialFolderId !== "root") {
            this.folderTreePresenter.selectFolder(initialFolderId);
        }

        this._disposeReaction = reaction(
            () => this.folderTreePresenter.vm.currentFolderId,
            folderId => {
                const effectiveFolderId = folderId ?? "root";
                this.listPresenter.actions.filter.set("folderId", effectiveFolderId);
            }
        );
    }

    dispose(): void {
        if (this._disposeReaction) {
            this._disposeReaction();
            this._disposeReaction = null;
        }
    }

    private shouldShowFolders(): boolean {
        const { appliedQuery } = this.listPresenter.vm;
        if (!appliedQuery) {
            return true;
        }

        if (appliedQuery.search) {
            return false;
        }

        const filterKeys = Object.keys(appliedQuery.filters ?? {}).filter(k => k !== "folderId");
        if (filterKeys.length > 0) {
            return false;
        }

        return true;
    }
}

export const RedirectListPresenter = Abstraction.createImplementation({
    implementation: RedirectListPresenterImpl,
    dependencies: [
        ListPresenter,
        FolderTreePresenter,
        CreateRedirectPresenter,
        EditRedirectPresenter,
        ListRedirectsUseCase,
        RedirectsListCache,
        GetDescendantFoldersUseCase
    ]
});
