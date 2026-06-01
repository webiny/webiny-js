import { computed, makeAutoObservable, reaction } from "mobx";
import type { IReactionDisposer } from "mobx";
import { ListPresenter } from "@webiny/app-admin/presentation/listPresenter/abstractions.js";
import { FolderTreePresenter } from "@webiny/app-aco/presentation/folderTree/abstractions.js";
import type { CmsContentEntry, CmsModel } from "~/types.js";
import { ListEntriesUseCase } from "~/features/contentEntry/listEntries/abstractions.js";
import { BulkActionUseCase } from "~/features/contentEntry/bulkAction/abstractions.js";
import { ContentEntriesCache } from "~/features/contentEntry/abstractions.js";
import {
    ContentEntriesPresenter as Abstraction,
    type IContentEntriesPresenter,
    type IContentEntriesViewModel,
    type IContentEntriesActions,
    type IContentEntriesInitConfig
} from "./abstractions.js";
import { ContentEntriesDataSource } from "./ContentEntriesDataSource.js";

class ContentEntriesPresenterImpl implements IContentEntriesPresenter {
    private _model: CmsModel | null = null;
    private _selectedEntryId: string | null = null;
    private _loading = false;
    private _disposeReaction: IReactionDisposer | null = null;

    constructor(
        private listPresenter: ListPresenter.Interface<CmsContentEntry>,
        private folderTreePresenter: FolderTreePresenter.Interface,
        private listEntriesUseCase: ListEntriesUseCase.Interface,
        private bulkActionUseCase: BulkActionUseCase.Interface,
        private cache: ContentEntriesCache.Interface
    ) {
        makeAutoObservable<
            ContentEntriesPresenterImpl,
            "_disposeReaction" | "listEntriesUseCase" | "bulkActionUseCase" | "cache"
        >(this, {
            _disposeReaction: false,
            listEntriesUseCase: false,
            bulkActionUseCase: false,
            cache: false,
            vm: computed
        });
    }

    get vm(): IContentEntriesViewModel {
        return {
            model: this._model,
            list: this.listPresenter.vm,
            folders: this.folderTreePresenter.vm,
            selectedEntryId: this._selectedEntryId,
            showingEntry: this._selectedEntryId !== null,
            loading: this._loading
        };
    }

    actions: IContentEntriesActions = {
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
        selectEntry: (id: string) => {
            this._selectedEntryId = id;
        },
        deselectEntry: () => {
            this._selectedEntryId = null;
        },
        createEntry: () => {
            this._selectedEntryId = "new";
        },
        bulkAction: async (action: string, data?: Record<string, unknown>) => {
            if (!this._model) {
                return;
            }

            const selectedIds = this.listPresenter.vm.selection.selectedIds;
            const where: Record<string, unknown> = {
                id_in: Array.from(selectedIds)
            };

            await this.bulkActionUseCase.execute({
                model: this._model,
                action,
                where,
                data
            });

            this.listPresenter.actions.selection.deselectAll();
            await this.listPresenter.actions.refresh();
        }
    };

    init(config: IContentEntriesInitConfig): void {
        this._loading = true;
        this._model = null;

        // Model will be set externally via setModel() after loading.
        // For now, store the config for when the model arrives.
        this._initConfig = config;
    }

    private _initConfig: IContentEntriesInitConfig | null = null;

    setModel(model: CmsModel): void {
        this._model = model;
        this._loading = false;

        const initialFolderId = this._initConfig?.initialFolderId ?? "root";

        const dataSource = new ContentEntriesDataSource(model, this.listEntriesUseCase, this.cache);

        this.listPresenter.init({
            dataSource,
            initialSort: { field: "savedOn", direction: "DESC" },
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
}

export const ContentEntriesPresenterImplementation = Abstraction.createImplementation({
    implementation: ContentEntriesPresenterImpl,
    dependencies: [
        ListPresenter,
        FolderTreePresenter,
        ListEntriesUseCase,
        BulkActionUseCase,
        ContentEntriesCache
    ]
});
