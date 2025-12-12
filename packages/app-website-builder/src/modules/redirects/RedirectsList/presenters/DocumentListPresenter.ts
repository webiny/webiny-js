import type { Folder } from "@webiny/app-aco/domain/folder/Folder.js";
import { folderCacheFactory } from "@webiny/app-aco/features/folders/cache/index.js";
import { makeAutoObservable } from "mobx";
import orderBy from "lodash/orderBy.js";
import { loadingActions, ROOT_FOLDER, WB_REDIRECTS_APP } from "~/constants.js";
import type { ISortingRepository } from "@webiny/app-utils";
import {
    type ILoadingRepository,
    type IMetaRepository,
    loadingRepositoryFactory,
    metaRepositoryFactory,
    SortingMapper,
    sortRepositoryFactory
} from "@webiny/app-utils";
import { type IListCache, redirectListCache } from "~/domain/Redirect/index.js";
import { TableRowMapper } from "~/modules/redirects/RedirectsList/presenters/TableRowMapper.js";
import { type ISearchRepository, searchRepositoryFactory } from "~/domain/Search/index.js";
import {
    type ISelectedItemsRepository,
    selectedItemsRepositoryFactory
} from "~/domain/SelectedItem/index.js";
import { filterRepositoryFactory, type IFilterRepository } from "~/domain/Filter/index.js";
import type { Redirect } from "~/domain/Redirect/index.js";

interface DocumentListPresenterParams {
    folderId: string;
}

class DocumentListPresenter {
    private folderId: string = ROOT_FOLDER;
    private foldersCache: IListCache<Folder>;
    private foldersLoadingRepository: ILoadingRepository;
    private documentsCache: IListCache<Redirect>;
    private documentsLoadingRepository: ILoadingRepository;
    private searchRepository: ISearchRepository;
    private metaRepository: IMetaRepository;
    private sortingRepository: ISortingRepository;
    private filterRepository: IFilterRepository;
    private selectedRepository: ISelectedItemsRepository;
    private filtersVisible: boolean = false;

    constructor() {
        this.foldersCache = folderCacheFactory.getCache(WB_REDIRECTS_APP);
        this.foldersLoadingRepository = loadingRepositoryFactory.getRepository(WB_REDIRECTS_APP);
        this.documentsCache = redirectListCache;
        this.documentsLoadingRepository = loadingRepositoryFactory.getRepository("WbRedirect");
        this.searchRepository = searchRepositoryFactory.getRepository("WbRedirect");
        this.metaRepository = metaRepositoryFactory.getRepository("WbRedirect");
        this.sortingRepository = sortRepositoryFactory.getRepository("WbRedirect");
        this.filterRepository = filterRepositoryFactory.getRepository("WbRedirect");
        this.selectedRepository = selectedItemsRepositoryFactory.getRepository("WbRedirect");
        makeAutoObservable(this);
    }

    public init(params: DocumentListPresenterParams) {
        this.folderId = params.folderId;
    }

    public get vm() {
        return {
            folderId: this.folderId,
            title: this.getVmTitle(),
            data: this.getData(),
            selected: this.getSelected(),
            meta: {
                totalCount: this.metaRepository.get().totalCount ?? 0,
                currentCount: this.documentsCache.count() ?? 0
            },
            sorting: this.getSorting(),
            searchQuery: this.searchRepository.get() || "",
            searchLabel: this.getSearchLabel(),
            isSearch: this.getIsSearch(),
            isEmpty: this.getIsEmpty(),
            isRoot: this.getIsRoot(),
            isLoading: this.getIsLoading(),
            isLoadingMore: this.getIsLoadingMore(),
            isFilterVisible: this.filtersVisible
        };
    }

    public showFilters = (show: boolean) => {
        this.filtersVisible = show;
    };

    private getIsRoot = () => {
        return this.folderId === ROOT_FOLDER;
    };

    private getVmTitle = () => {
        return !this.getIsLoading()
            ? this.foldersCache.getItem(f => f.id === this.folderId)?.title
            : undefined;
    };

    private getVmDocuments = () => {
        return this.documentsCache.getItems().map(d => TableRowMapper.fromRedirect(d));
    };

    private getVmFolders = () => {
        const folders = this.foldersCache.getItems().filter(f => {
            if (this.folderId === ROOT_FOLDER) {
                return f.parentId === null;
            } else {
                return f.parentId === this.folderId;
            }
        });

        return folders.map(f => TableRowMapper.fromFolder(f));
    };

    private getData = () => {
        if (this.getIsSearch()) {
            // Only documents, sorted if needed
            return this.sortItems(this.getVmDocuments());
        }

        // Not in search: folders first, then documents, both sorted if needed
        const folders = this.sortItems(this.getVmFolders());
        const documents = this.sortItems(this.getVmDocuments());
        return [...folders, ...documents];
    };

    private getSelected = () => {
        return this.selectedRepository.getSelectedItems();
    };

    private sortItems<T>(items: T[]): T[] {
        const sorts = this.sortingRepository.get();
        if (sorts.length === 0) {
            return items;
        }
        const iteratees = sorts.map(sort => sort.field);
        const orders = sorts.map(sort => sort.order);
        return orderBy(items, iteratees, orders);
    }

    private getIsSearch = () => {
        return Boolean(this.searchRepository.get() || this.filterRepository.hasFilters());
    };

    private getSearchLabel = () => {
        const currentFolder = this.foldersCache.getItem(f => f.id === this.folderId);

        if (this.folderId === ROOT_FOLDER || !currentFolder) {
            return "Search...";
        }

        return `Search in "${currentFolder.title}"...`;
    };

    private getIsLoading = () => {
        return Boolean(
            this.documentsLoadingRepository.isLoading(loadingActions.init) ||
                this.documentsLoadingRepository.isLoading(loadingActions.list) ||
                this.foldersLoadingRepository.isLoading(this.folderId)
        );
    };

    private getIsLoadingMore = () => {
        return Boolean(this.documentsLoadingRepository.isLoading(loadingActions.listMore));
    };

    private getIsEmpty() {
        return !this.getIsLoading() && !this.getData().length;
    }

    private getSorting = () => {
        return this.sortingRepository.get().map(sort => {
            return SortingMapper.fromDTOtoColumn(sort);
        });
    };
}

export { DocumentListPresenter, type DocumentListPresenterParams };
