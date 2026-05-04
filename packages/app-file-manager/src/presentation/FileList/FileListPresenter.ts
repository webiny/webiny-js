import { makeAutoObservable, reaction, computed } from "mobx";
import {
    FileListPresenter as Abstraction,
    type IFileListPresenter,
    type IFileListViewModel,
    type IFileListActions,
    type IFileListOverlayConfig
} from "./abstractions.js";
import { FileListDataSource } from "./FileListDataSource.js";
import { ListPresenter } from "@webiny/app-admin/presentation/listPresenter/abstractions.js";
import { FolderTreePresenter } from "@webiny/app-aco/presentation/folderTree/abstractions.js";
import { FileManagerPermissions } from "../../features/permissions/abstractions.js";
import { GetSettingsRepository } from "../../features/settings/abstractions.js";
import { ListTagsRepository } from "../../features/tags/abstractions.js";
import { FileUploader } from "../../features/fileUploader/abstractions.js";
import { LocalStorage } from "@webiny/app/features/localStorage";
import { ListFilesUseCase } from "../../features/listFiles/abstractions.js";
import { FilesListCache } from "../../features/shared/abstractions.js";
import { GetDescendantFoldersUseCase } from "@webiny/app-aco/features/folders/getDescendantFolders/abstractions.js";
import type { FmFile } from "../../features/shared/types.js";

const VIEW_MODE_KEY = "fm:viewMode";

class FileListPresenterImpl implements IFileListPresenter {
    private _viewMode: "table" | "grid" = "table";
    private _dragging = false;
    private _overlayConfig: IFileListOverlayConfig | null = null;
    private _disposeReaction: (() => void) | null = null;

    constructor(
        private listPresenter: ListPresenter.Interface<FmFile>,
        private folderTreePresenter: FolderTreePresenter.Interface,
        private permissions: FileManagerPermissions.Interface,
        private settingsRepository: GetSettingsRepository.Interface,
        private tagsRepository: ListTagsRepository.Interface,
        private fileUploader: FileUploader.Interface,
        private localStorage: LocalStorage.Interface,
        private listFilesUseCase: ListFilesUseCase.Interface,
        private filesListCache: FilesListCache.Interface,
        private getDescendantFoldersUseCase: GetDescendantFoldersUseCase.Interface
    ) {
        makeAutoObservable<FileListPresenterImpl, "_overlayConfig" | "_disposeReaction">(this, {
            _overlayConfig: false,
            _disposeReaction: false,
            vm: computed
        });

        // Restore persisted view mode.
        const stored = this.localStorage.get<"table" | "grid">(VIEW_MODE_KEY);
        if (stored === "table" || stored === "grid") {
            this._viewMode = stored;
        }
    }

    get vm(): IFileListViewModel {
        return {
            list: this.listPresenter.vm,
            folders: this.folderTreePresenter.vm,
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
            isOverlay: this._overlayConfig !== null
        };
    }

    // Actions forwarded from ListPresenter with domain-specific additions.
    actions: IFileListActions = {
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
        // Domain-specific actions.
        upload: async (files: File[]) => {
            await this.fileUploader.uploadMany(
                files.map(file => ({ file, data: { name: file.name, type: file.type } }))
            );
        },
        setViewMode: (mode: "table" | "grid") => {
            this._viewMode = mode;
            this.localStorage.set(VIEW_MODE_KEY, mode);
        },
        selectFile: (file: FmFile) => {
            if (!this._overlayConfig) {
                return;
            }

            if (this._overlayConfig.multiple) {
                // Multi mode: toggle the file in the selection set.
                this.listPresenter.actions.selection.toggle(file.id);
            } else {
                // Single mode: call onChange immediately.
                this._overlayConfig.onChange([file]);
            }
        },
        confirmSelection: () => {
            if (!this._overlayConfig) {
                return;
            }

            // Collect selected files from the current rows.
            const selectedIds = this.listPresenter.vm.selection.selectedIds;
            const selectedFiles = this.listPresenter.vm.rows.filter(f => selectedIds.has(f.id));

            if (selectedFiles.length > 0) {
                this._overlayConfig.onChange(selectedFiles);
            }
        },
        // Folder actions forwarded from FolderTreePresenter.
        folders: {
            selectFolder: (folderId: string | null) =>
                this.folderTreePresenter.selectFolder(folderId),
            createFolder: (parentFolderId?: string) =>
                this.folderTreePresenter.createFolder(parentFolderId),
            editFolder: (folderId: string) => this.folderTreePresenter.editFolder(folderId),
            deleteFolder: (folderId: string) => this.folderTreePresenter.deleteFolder(folderId),
            cancelOperation: () => {
                this.folderTreePresenter.cancelOperation();
            }
        }
    };

    init(overlayConfig?: IFileListOverlayConfig): void {
        this._overlayConfig = overlayConfig ?? null;

        // Create the data source adapter.
        const dataSource = new FileListDataSource(
            this.listFilesUseCase,
            this.filesListCache,
            this.getDescendantFoldersUseCase
        );

        // Initialize the list presenter with the data source and default sort.
        this.listPresenter.init({
            dataSource,
            initialSort: { field: "createdOn", direction: "DESC" }
        });

        // Wire folder changes to list filtering via MobX reaction.
        this._disposeReaction = reaction(
            () => this.folderTreePresenter.vm.currentFolderId,
            folderId => {
                if (folderId) {
                    this.listPresenter.actions.filter.set("folderId", folderId);
                } else {
                    this.listPresenter.actions.filter.clear("folderId");
                }
            }
        );
    }
}

export const FileListPresenter = Abstraction.createImplementation({
    implementation: FileListPresenterImpl,
    dependencies: [
        ListPresenter,
        FolderTreePresenter,
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
