import { makeAutoObservable, reaction, computed, runInAction } from "mobx";
import {
    FileManagerPresenter as Abstraction,
    type IFileManagerPresenter,
    type IFileManagerViewModel,
    type IFileManagerActions,
    type IFileManagerOverlayConfig
} from "./abstractions.js";
import { FileListDataSource } from "./FileListDataSource.js";
import { ListPresenter } from "@webiny/app-admin/presentation/listPresenter/abstractions.js";
import { FolderTreePresenter } from "@webiny/app-aco/presentation/folderTree/abstractions.js";
import { FileDetailsPresenter } from "../FileDetails/abstractions.js";
import { FileManagerPermissions } from "../../features/permissions/abstractions.js";
import { GetSettingsRepository } from "../../features/settings/abstractions.js";
import { ListTagsRepository } from "../../features/tags/abstractions.js";
import { FileUploader } from "../../features/fileUploader/abstractions.js";
import { LocalStorage } from "@webiny/app/features/localStorage";
import { ListFilesUseCase } from "../../features/listFiles/abstractions.js";
import { FilesListCache } from "../../features/shared/abstractions.js";
import { GetDescendantFoldersUseCase } from "@webiny/app-aco/features/folders/getDescendantFolders/abstractions.js";
import type { FmFile } from "../../features/shared/types.js";
import type { IFileDetailsPresenter } from "../FileDetails/abstractions.js";

const VIEW_MODE_KEY = "fm:viewMode";

class FileManagerPresenterImpl implements IFileManagerPresenter {
    private _viewMode: "table" | "grid" = "table";
    private _dragging = false;
    private _overlayConfig: IFileManagerOverlayConfig | null = null;
    private _disposeReaction: (() => void) | null = null;
    private _fileDetails: IFileDetailsPresenter | null = null;
    private _showingFilters = false;

    constructor(
        private listPresenter: ListPresenter.Interface<FmFile>,
        private folderTreePresenter: FolderTreePresenter.Interface,
        private fileDetailsPresenter: FileDetailsPresenter.Interface,
        private permissions: FileManagerPermissions.Interface,
        private settingsRepository: GetSettingsRepository.Interface,
        private tagsRepository: ListTagsRepository.Interface,
        private fileUploader: FileUploader.Interface,
        private localStorage: LocalStorage.Interface,
        private listFilesUseCase: ListFilesUseCase.Interface,
        private filesListCache: FilesListCache.Interface,
        private getDescendantFoldersUseCase: GetDescendantFoldersUseCase.Interface
    ) {
        makeAutoObservable<
            FileManagerPresenterImpl,
            "_overlayConfig" | "_disposeReaction" | "fileDetailsPresenter"
        >(this, {
            _overlayConfig: false,
            _disposeReaction: false,
            fileDetailsPresenter: false,
            vm: computed
        });

        const stored = this.localStorage.get<"table" | "grid">(VIEW_MODE_KEY);
        if (stored === "table" || stored === "grid") {
            this._viewMode = stored;
        }
    }

    get vm(): IFileManagerViewModel {
        return {
            list: this.listPresenter.vm,
            folders: this.folderTreePresenter.vm,
            fileDetails: this._fileDetails,
            permissions: {
                canRead: this.permissions.canRead("file"),
                canCreate: this.permissions.canCreate("file"),
                canEdit: this.permissions.canEdit("file"),
                canDelete: this.permissions.canDelete("file")
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
            viewMode: this._viewMode,
            dragging: this._dragging,
            showingFilters: this._showingFilters,
            isOverlay: this._overlayConfig !== null,
            accept: this._overlayConfig?.accept ?? [],
            multiple: this._overlayConfig?.multiple ?? false,
            scope: this._overlayConfig?.scope
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
            toggle: (id: string, shiftKey?: boolean) =>
                this.listPresenter.actions.selection.toggle(id, shiftKey),
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
        selectFile: (file: FmFile) => {
            if (!this._overlayConfig) {
                return;
            }

            if (this._overlayConfig.multiple) {
                this.listPresenter.actions.selection.toggle(file.id);
            } else {
                this._overlayConfig.onChange([file]);
            }
        },
        confirmSelection: () => {
            if (!this._overlayConfig) {
                return;
            }

            const selectedIds = this.listPresenter.vm.selection.selectedIds;
            const selectedFiles = this.listPresenter.vm.rows.filter(f => selectedIds.has(f.id));

            if (selectedFiles.length > 0) {
                this._overlayConfig.onChange(selectedFiles);
            }
        },
        showFileDetails: (id: string) => {
            this._fileDetails = this.fileDetailsPresenter;
            void this.fileDetailsPresenter.loadFile(id);
        },
        hideFileDetails: () => {
            this._fileDetails = null;
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
            cancelOperation: () => {
                this.folderTreePresenter.cancelOperation();
            }
        }
    };

    init(overlayConfig?: IFileManagerOverlayConfig): void {
        this._overlayConfig = overlayConfig ?? null;

        const dataSource = new FileListDataSource(
            this.listFilesUseCase,
            this.filesListCache,
            this.getDescendantFoldersUseCase,
            this._overlayConfig?.scope
        );

        this.listPresenter.init({
            dataSource,
            initialSort: { field: "createdOn", direction: "DESC" },
            initialFilters: { folderId: "root" },
            limit: 50
        });

        this._disposeReaction = reaction(
            () => this.folderTreePresenter.vm.currentFolderId,
            folderId => {
                this.listPresenter.actions.filter.set("folderId", folderId ?? "root");
            }
        );
    }
}

export const FileManagerPresenter = Abstraction.createImplementation({
    implementation: FileManagerPresenterImpl,
    dependencies: [
        ListPresenter,
        FolderTreePresenter,
        FileDetailsPresenter,
        FileManagerPermissions,
        GetSettingsRepository,
        ListTagsRepository,
        FileUploader,
        LocalStorage,
        ListFilesUseCase,
        FilesListCache,
        GetDescendantFoldersUseCase
    ]
});
