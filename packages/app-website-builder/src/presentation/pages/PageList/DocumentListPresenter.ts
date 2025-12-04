import { makeAutoObservable } from "mobx";
import orderBy from "lodash/orderBy.js";
import { loadingActions, ROOT_FOLDER, WB_PAGE_APP } from "~/constants.js";
import type { ISortingRepository } from "@webiny/app-utils";
import {
    type ILoadingRepository,
    type IMetaRepository,
    loadingRepositoryFactory,
    metaRepositoryFactory,
    SortingMapper,
    sortRepositoryFactory
} from "@webiny/app-utils";
import { type IListCache, type Page, PageDtoMapper, pageListCache } from "~/domain/Page/index.js";
import { type Folder, FolderDtoMapper } from "@webiny/app-aco";
import { folderCacheFactory } from "@webiny/app-aco";
import { type ISearchRepository, searchRepositoryFactory } from "~/domain/Search/index.js";
import {
    type ISelectedItemsRepository,
    selectedItemsRepositoryFactory
} from "~/domain/SelectedItem/index.js";
import { filterRepositoryFactory, type IFilterRepository } from "~/domain/Filter/index.js";
import { PageListPresenter } from "./abstractions.js";

class DocumentListPresenter implements PageListPresenter.Interface {
    private folderId: string = ROOT_FOLDER;
    private foldersCache: IListCache<Folder>;
    private documentsCache: IListCache<Page>;
    private foldersLoadingRepository: ILoadingRepository;
    private documentsLoadingRepository: ILoadingRepository;
    private searchRepository: ISearchRepository;
    private metaRepository: IMetaRepository;
    private sortingRepository: ISortingRepository;
    private filterRepository: IFilterRepository;
    private selectedRepository: ISelectedItemsRepository;
    private filtersVisible: boolean = false;

    constructor() {
        this.foldersCache = folderCacheFactory.getCache(WB_PAGE_APP);
        this.documentsCache = pageListCache;
        this.foldersLoadingRepository = loadingRepositoryFactory.getRepository(WB_PAGE_APP);
        this.documentsLoadingRepository = loadingRepositoryFactory.getRepository("WbPage");
        this.searchRepository = searchRepositoryFactory.getRepository("WbPage");
        this.metaRepository = metaRepositoryFactory.getRepository("WbPage");
        this.sortingRepository = sortRepositoryFactory.getRepository("WbPage");
        this.filterRepository = filterRepositoryFactory.getRepository("WbPage");
        this.selectedRepository = selectedItemsRepositoryFactory.getRepository("WbPage");
        makeAutoObservable(this);
    }

    public init(params: PageListPresenter.Init) {
        this.folderId = params.folderId;
    }

    public get vm(): PageListPresenter.ViewModel {
        const data = this.getVmDocuments();
        const folders = this.getVmFolders();
        const isEmpty = !this.getIsLoading() && data.length === 0 && folders.length === 0;

        return {
            folderId: this.folderId,
            title: this.getVmTitle(),
            data,
            folders,
            selected: this.getSelected(),
            meta: {
                totalCount: this.metaRepository.get().totalCount ?? 0,
                currentCount: this.documentsCache.count() ?? 0
            },
            sorting: this.getSorting(),
            searchQuery: this.searchRepository.get() || "",
            searchLabel: this.getSearchLabel(),
            isSearch: this.getIsSearch(),
            isEmpty,
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
        const documents = this.documentsCache.getItems().map(d => PageDtoMapper.toDTO(d));
        return this.sortItems(documents);
    };

    private getVmFolders = () => {
        if (this.getIsSearch()) {
            return [];
        }

        const folders = this.foldersCache.getItems().filter(f => {
            if (this.folderId === ROOT_FOLDER) {
                return f.parentId === null;
            } else {
                return f.parentId === this.folderId;
            }
        });

        return this.sortItems(folders).map(folder => FolderDtoMapper.toDTO(folder));
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

    private getSorting = () => {
        return this.sortingRepository.get().map(sort => {
            return SortingMapper.fromDTOtoColumn(sort);
        });
    };
}

export { DocumentListPresenter };
