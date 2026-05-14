import { makeAutoObservable, reaction, runInAction, computed } from "mobx";
import type { FmFile } from "@webiny/sdk";
import type { CmsModel } from "@webiny/app-headless-cms-common/types/index.js";
import { ListPresenter } from "@webiny/app-admin/presentation/listPresenter/abstractions.js";
import { FolderTreePresenter } from "@webiny/app-aco/presentation/folderTree/abstractions.js";
import { LocalStorage } from "@webiny/app/features/localStorage";
import { GetDescendantFoldersUseCase } from "@webiny/app-aco/features/folders/getDescendantFolders/abstractions.js";
import {
    FileManagerPresenter as Abstraction,
    type IFileManagerPresenter,
    type IFileManagerViewModel,
    type IFileManagerActions,
    type IFileManagerInitConfig
} from "./abstractions.js";
import { FileListDataSource } from "./FileListDataSource.js";
import { FileDetailsPresenter } from "../FileDetails/abstractions.js";
import { FileManagerPermissions } from "~/features/permissions/abstractions.js";
import { ListTagsRepository } from "~/features/tags/index.js";
import { FileUploader } from "~/features/fileUploader/index.js";
import { ListFilesUseCase } from "~/features/listFiles/index.js";
import { FilesListCache } from "~/features/shared/index.js";
import { FileModelProvider } from "~/features/fileModel/index.js";
import type { IFileDetailsPresenter } from "../FileDetails/abstractions.js";

const VIEW_MODE_KEY = "fm:viewMode";
const LAST_FOLDER_KEY = "fm:lastFolder";

class FileManagerPresenterImpl implements IFileManagerPresenter {
    private _viewMode: "table" | "grid" = "grid";
    private _dragging = false;
    private _disposeReaction: (() => void) | null = null;
    private _fileDetails: IFileDetailsPresenter | null = null;
    private _showingFilters = false;
    private _fileModel: CmsModel | null = null;
    private _persistFolder = true;

    constructor(
        private listPresenter: ListPresenter.Interface<FmFile>,
        private folderTreePresenter: FolderTreePresenter.Interface,
        private fileDetailsPresenter: FileDetailsPresenter.Interface,
        private permissions: FileManagerPermissions.Interface,
        private tagsRepository: ListTagsRepository.Interface,
        private fileUploader: FileUploader.Interface,
        private localStorage: LocalStorage.Interface,
        private listFilesUseCase: ListFilesUseCase.Interface,
        private filesListCache: FilesListCache.Interface,
        private getDescendantFoldersUseCase: GetDescendantFoldersUseCase.Interface,
        private fileModelProvider: FileModelProvider.Interface
    ) {
        makeAutoObservable<
            FileManagerPresenterImpl,
            "_disposeReaction" | "fileDetailsPresenter" | "_persistFolder"
        >(this, {
            _disposeReaction: false,
            fileDetailsPresenter: false,
            _persistFolder: false,
            vm: computed
        });

        const stored = this.localStorage.get<"table" | "grid">(VIEW_MODE_KEY);
        if (stored === "table" || stored === "grid") {
            this._viewMode = stored;
        }
    }

    get vm(): IFileManagerViewModel {
        return {
            fileModel: this._fileModel,
            list: this.listPresenter.vm,
            folders: this.folderTreePresenter.vm,
            fileDetails: this._fileDetails,
            // Flat booleans for UI visibility (e.g., show/hide buttons).
            // Per-file methods for ownership-aware checks (e.g., "own" scope).
            permissions: {
                canRead: this.permissions.canRead("file"),
                canCreate: this.permissions.canCreate("file"),
                canEdit: this.permissions.canEdit("file"),
                canDelete: this.permissions.canDelete("file"),
                canEditFile: (file: FmFile) => this.permissions.canEdit("file", file),
                canDeleteFile: (file: FmFile) => this.permissions.canDelete("file", file)
            },
            upload: {
                jobs: this.fileUploader.vm.jobs,
                overallProgress: {
                    percentage: this.fileUploader.vm.overallProgress.percentage,
                    bytesSent: this.fileUploader.vm.overallProgress.sent,
                    totalBytes: this.fileUploader.vm.overallProgress.total
                },
                isUploading: this.fileUploader.vm.isUploading
            },
            tags: this.tagsRepository.tags,
            showFolders: this.shouldShowFolders(),
            viewMode: this._viewMode,
            dragging: this._dragging,
            showingFilters: this._showingFilters
        };
    }

    actions: IFileManagerActions = {
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
        upload: async (files: File[]) => {
            const folderId = this.folderTreePresenter.vm.currentFolderId ?? "root";
            await this.fileUploader.uploadMany(
                files.map(file => ({
                    file,
                    data: {
                        name: file.name,
                        type: file.type,
                        location: { folderId }
                    }
                }))
            );
            this.fileUploader.clear();
        },
        setViewMode: (mode: "table" | "grid") => {
            this._viewMode = mode;
            this.localStorage.set(VIEW_MODE_KEY, mode);
        },
        setDragging: (dragging: boolean) => {
            this._dragging = dragging;
        },
        showFilters: () => {
            this._showingFilters = true;
        },
        hideFilters: () => {
            this._showingFilters = false;
        },
        showFileDetails: (id: string) => {
            this._fileDetails = this.fileDetailsPresenter;
            void this.fileDetailsPresenter.loadFile(id);
        },
        hideFileDetails: () => {
            this._fileDetails = null;
        },
        folders: {
            // Clear search when navigating to a folder — gives the user a clean slate.
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
            cancelOperation: () => {
                this.folderTreePresenter.cancelOperation();
            }
        }
    };

    init(config?: IFileManagerInitConfig): void {
        const initialFolderId =
            config?.initialFolderId ?? this.localStorage.get<string>(LAST_FOLDER_KEY) ?? "root";

        // Don't persist folder navigation when an explicit initial folder is provided (e.g., overlay).
        this._persistFolder = !config?.initialFolderId;

        const dataSource = new FileListDataSource(
            this.listFilesUseCase,
            this.filesListCache,
            this.getDescendantFoldersUseCase,
            config?.scope
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

        // Sync folder navigation → file list: when the user selects a folder in the tree,
        // update the folderId filter so the file list re-queries for that folder's contents.
        this._disposeReaction = reaction(
            () => this.folderTreePresenter.vm.currentFolderId,
            folderId => {
                const effectiveFolderId = folderId ?? "root";
                this.listPresenter.actions.filter.set("folderId", effectiveFolderId);

                if (this._persistFolder) {
                    this.localStorage.set(LAST_FOLDER_KEY, effectiveFolderId);
                }
            }
        );

        void this.tagsRepository.execute({});

        // Load the CMS model in the background. The FileModelModule already kicks off
        // loading at app startup, so this usually resolves from cache instantly.
        // The view shows a loading overlay until `_fileModel` is set.
        void this.fileModelProvider.getModel().then(model => {
            runInAction(() => {
                this._fileModel = model;
            });
        });
    }

    dispose(): void {
        if (this._disposeReaction) {
            this._disposeReaction();
            this._disposeReaction = null;
        }
    }

    // Hide folders when the user is actively filtering or searching.
    // Uses `appliedQuery` (not `vm.search`) so folders stay visible while typing
    // and only disappear once the debounced query has actually executed.
    private shouldShowFolders(): boolean {
        const { appliedQuery } = this.listPresenter.vm;
        if (!appliedQuery) {
            return true;
        }

        if (appliedQuery.search) {
            return false;
        }

        // `folderId` is always present as a default filter; ignore it.
        const filterKeys = Object.keys(appliedQuery.filters ?? {}).filter(k => k !== "folderId");
        if (filterKeys.length > 0) {
            return false;
        }

        return true;
    }
}

export const FileManagerPresenter = Abstraction.createImplementation({
    implementation: FileManagerPresenterImpl,
    dependencies: [
        ListPresenter,
        FolderTreePresenter,
        FileDetailsPresenter,
        FileManagerPermissions,
        ListTagsRepository,
        FileUploader,
        LocalStorage,
        ListFilesUseCase,
        FilesListCache,
        GetDescendantFoldersUseCase,
        FileModelProvider
    ]
});
