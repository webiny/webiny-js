import { computed, makeAutoObservable, reaction } from "mobx";
import type { IReactionDisposer } from "mobx";
import { ListPresenter } from "@webiny/app-admin/presentation/listPresenter/abstractions.js";
import { FolderTreePresenter } from "@webiny/app-aco/presentation/folderTree/abstractions.js";
import type { CmsContentEntry, CmsModel } from "~/types.js";
import { ListEntriesUseCase } from "~/features/contentEntry/listEntries/abstractions.js";
import { DeleteEntryUseCase } from "~/features/contentEntry/deleteEntry/abstractions.js";
import { PublishEntryUseCase } from "~/features/contentEntry/publishEntry/abstractions.js";
import { UnpublishEntryUseCase } from "~/features/contentEntry/unpublishEntry/abstractions.js";
import { BulkActionUseCase } from "~/features/contentEntry/bulkAction/abstractions.js";
import { ContentEntriesCache } from "~/features/contentEntry/abstractions.js";
import {
    ContentEntriesPresenter as Abstraction,
    type IContentEntriesPresenter,
    type IContentEntriesViewModel,
    type IContentEntriesInitConfig
} from "./abstractions.js";
import { ContentEntriesDataSource } from "./ContentEntriesDataSource.js";

class ContentEntriesPresenterImpl implements IContentEntriesPresenter {
    private _model: CmsModel | null = null;
    private _selectedEntryId: string | null = null;
    private _loading = false;
    private _disposeReaction: IReactionDisposer | null = null;
    private _initConfig: IContentEntriesInitConfig | null = null;

    constructor(
        private _listPresenter: ListPresenter.Interface<CmsContentEntry>,
        private _foldersPresenter: FolderTreePresenter.Interface,
        private listEntriesUseCase: ListEntriesUseCase.Interface,
        private deleteEntryUseCase: DeleteEntryUseCase.Interface,
        private publishEntryUseCase: PublishEntryUseCase.Interface,
        private unpublishEntryUseCase: UnpublishEntryUseCase.Interface,
        private bulkActionUseCase: BulkActionUseCase.Interface,
        private cache: ContentEntriesCache.Interface
    ) {
        makeAutoObservable<
            ContentEntriesPresenterImpl,
            | "_disposeReaction"
            | "listEntriesUseCase"
            | "deleteEntryUseCase"
            | "publishEntryUseCase"
            | "unpublishEntryUseCase"
            | "bulkActionUseCase"
            | "cache"
        >(this, {
            _disposeReaction: false,
            listEntriesUseCase: false,
            deleteEntryUseCase: false,
            publishEntryUseCase: false,
            unpublishEntryUseCase: false,
            bulkActionUseCase: false,
            cache: false,
            vm: computed
        });
    }

    get vm(): IContentEntriesViewModel {
        const hasSearch = this._listPresenter.vm.search.length > 0;
        const hasFilters = Object.keys(this._listPresenter.vm.filters).some(k => k !== "folderId");

        return {
            model: this._model,
            selectedEntryId: this._selectedEntryId,
            showingEntry: this._selectedEntryId !== null,
            showFolders: !hasSearch && !hasFilters,
            loading: this._loading
        };
    }

    get listPresenter(): ListPresenter.Interface<CmsContentEntry> {
        return this._listPresenter;
    }

    get foldersPresenter(): FolderTreePresenter.Interface {
        return this._foldersPresenter;
    }

    selectEntry(id: string): void {
        this._selectedEntryId = id;
    }

    deselectEntry(): void {
        this._selectedEntryId = null;
    }

    createEntry(): void {
        this._selectedEntryId = "new";
    }

    async deleteEntry(id: string): Promise<void> {
        if (!this._model) {
            return;
        }
        await this.deleteEntryUseCase.execute({ model: this._model, id });
        await this._listPresenter.actions.refresh();
    }

    async publishEntry(id: string): Promise<void> {
        if (!this._model) {
            return;
        }
        await this.publishEntryUseCase.execute({ model: this._model, revisionId: id });
        await this._listPresenter.actions.refresh();
    }

    async unpublishEntry(id: string): Promise<void> {
        if (!this._model) {
            return;
        }
        await this.unpublishEntryUseCase.execute({ model: this._model, revisionId: id });
        await this._listPresenter.actions.refresh();
    }

    async bulkAction(action: string, data?: Record<string, unknown>): Promise<void> {
        if (!this._model) {
            return;
        }

        const selectedIds = this._listPresenter.vm.selection.selectedIds;
        const where: Record<string, unknown> = {
            id_in: Array.from(selectedIds)
        };

        await this.bulkActionUseCase.execute({
            model: this._model,
            action,
            where,
            data
        });

        this._listPresenter.actions.selection.deselectAll();
        await this._listPresenter.actions.refresh();
    }

    init(config: IContentEntriesInitConfig): void {
        this._loading = true;
        this._model = null;
        this._initConfig = config;
    }

    setModel(model: CmsModel): void {
        this._model = model;
        this._loading = false;

        const initialFolderId = this._initConfig?.initialFolderId ?? "root";

        const dataSource = new ContentEntriesDataSource(model, this.listEntriesUseCase, this.cache);

        this._listPresenter.init({
            dataSource,
            initialSort: { field: "savedOn", direction: "DESC" },
            initialFilters: { folderId: initialFolderId },
            limit: 50
        });

        if (initialFolderId !== "root") {
            this._foldersPresenter.selectFolder(initialFolderId);
        }

        this._disposeReaction = reaction(
            () => this._foldersPresenter.vm.currentFolderId,
            folderId => {
                const effectiveFolderId = folderId ?? "root";
                this._listPresenter.actions.filter.set("folderId", effectiveFolderId);
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
        DeleteEntryUseCase,
        PublishEntryUseCase,
        UnpublishEntryUseCase,
        BulkActionUseCase,
        ContentEntriesCache
    ]
});
