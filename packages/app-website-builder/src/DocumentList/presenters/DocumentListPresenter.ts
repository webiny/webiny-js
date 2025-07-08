import { makeAutoObservable } from "mobx";
import type { PageDto } from "~/features/pages/listPages/index.js";
import type { TableItem } from "~/types.js";
import type { FolderItem } from "@webiny/app-aco/types.js";
import { loadingActions, ROOT_FOLDER } from "~/constants.js";
import type { MetaDTO } from "@webiny/app-utils";
import { type IParamsRepository, paramsRepositoryFactory } from "~/domains/Params/index.js";

interface DocumentListPresenterParams {
    folderId: string;
    documents: PageDto[];
    documentMeta: MetaDTO;
    documentsLoadingState: Record<string, boolean>;
    folders: FolderItem[];
    foldersLoadingState: Record<string, boolean>;
}

class DocumentListPresenter {
    private folderId: string = ROOT_FOLDER;
    private documents: PageDto[] = [];
    private documentMeta?: MetaDTO = undefined;
    private documentsLoadingState: Record<string, boolean> = {};
    private folders: FolderItem[] = [];
    private foldersLoadingState: Record<string, boolean> = {};
    private paramsRepository: IParamsRepository;

    constructor() {
        makeAutoObservable(this);
        this.paramsRepository = paramsRepositoryFactory.getRepository("WbPage");
    }

    public init(params: DocumentListPresenterParams) {
        this.folderId = params.folderId;
        this.documents = params.documents;
        this.documentMeta = params.documentMeta;
        this.documentsLoadingState = params.documentsLoadingState;
        this.folders = params.folders;
        this.foldersLoadingState = params.foldersLoadingState;
    }

    public get vm() {
        return {
            folderId: this.folderId,
            title: this.getVmTitle(),
            data: this.getVmFolders().concat(this.getVmDocuments()),
            meta: {
                totalCount: this.documentMeta?.totalCount ?? 0,
                currentCount: this.documents.length ?? 0
            },
            searchQuery: this.paramsRepository.get().search || "",
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
            ? this.folders.find(f => f.id === this.folderId)?.title
            : undefined;
    };

    private getVmDocuments = () => {
        return this.documents.filter(d => d.location.folderId === this.folderId) as TableItem[];
    };

    private getVmFolders = () => {
        return this.folders.filter(f => f.parentId === this.folderId) as TableItem[];
    };

    private getIsLoading = () => {
        return Boolean(
            this.documentsLoadingState[loadingActions.init] ||
                this.documentsLoadingState[loadingActions.list] ||
                this.foldersLoadingState[this.folderId]
        );
    };

    private getIsLoadingMore = () => {
        return Boolean(this.documentsLoadingState[loadingActions.listMore]);
    };
}

export { DocumentListPresenter, type DocumentListPresenterParams };
