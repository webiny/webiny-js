import { makeAutoObservable } from "mobx";
import { loadingActions, ROOT_FOLDER, WB_PAGE_APP } from "~/constants.js";
import {
    type ILoadingRepository,
    type IMetaRepository,
    loadingRepositoryFactory,
    metaRepositoryFactory
} from "@webiny/app-utils";
import { type IParamsRepository, paramsRepositoryFactory } from "~/domains/Params/index.js";
import { type IListCache, type Page, pageCacheFactory } from "~/domains/Page/index.js";
import { Folder, folderCacheFactory } from "@webiny/app-aco";
import { DocumentListMapper } from "~/DocumentList/presenters/DocumentListMapper.js";

interface DocumentListPresenterParams {
    folderId: string;
}

class DocumentListPresenter {
    private folderId: string = ROOT_FOLDER;
    private foldersCache: IListCache<Folder>;
    private foldersLoadingRepository: ILoadingRepository;
    private documentsCache: IListCache<Page>;
    private documentsLoadingRepository: ILoadingRepository;
    private paramsRepository: IParamsRepository;
    private metaRepository: IMetaRepository;

    constructor() {
        this.foldersCache = folderCacheFactory.getCache(WB_PAGE_APP);
        this.foldersLoadingRepository = loadingRepositoryFactory.getRepository(WB_PAGE_APP);
        this.documentsCache = pageCacheFactory.getCache();
        this.documentsLoadingRepository = loadingRepositoryFactory.getRepository("WbPage");
        this.metaRepository = metaRepositoryFactory.getRepository("WbPage");
        this.paramsRepository = paramsRepositoryFactory.getRepository("WbPage");
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
            meta: {
                totalCount: this.metaRepository.get().totalCount ?? 0,
                currentCount: this.documentsCache.count() ?? 0
            },
            searchQuery: this.paramsRepository.get().search || "",
            isSearch: this.getIsSearch(),
            isEmpty: this.getIsEmpty(),
            isRoot: this.getIsRoot(),
            isLoading: this.getIsLoading(),
            isLoadingMore: this.getIsLoadingMore()
        };
    }

    private getIsRoot = () => {
        return this.folderId === ROOT_FOLDER;
    };

    private getVmTitle = () => {
        return !this.getIsLoading()
            ? this.foldersCache.getItem(f => f.id === this.folderId)?.title
            : undefined;
    };

    private getVmDocuments = () => {
        return this.documentsCache
            .getItems()
            .filter(d => d.location.folderId === this.folderId)
            .map(d => DocumentListMapper.fromPage(d));
    };

    private getVmFolders = () => {
        return this.foldersCache
            .getItems()
            .filter(f => {
                if (this.folderId === ROOT_FOLDER) {
                    return f.parentId === null;
                } else {
                    return f.parentId === this.folderId;
                }
            })
            .map(f => DocumentListMapper.fromFolder(f));
    };

    private getData = () => {
        if (this.getIsSearch()) {
            return this.getVmDocuments();
        }

        return this.getVmFolders().concat(this.getVmDocuments());
    };

    private getIsSearch = () => {
        return Boolean(this.paramsRepository.get().search);
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
}

export { DocumentListPresenter, type DocumentListPresenterParams };
