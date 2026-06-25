import { createAbstraction } from "@webiny/feature/admin";
import type { SelectedFile } from "@webiny/app-admin/presentation/browserFilePicker/index.js";
import type { CmsModel } from "@webiny/app-headless-cms-common/types/index.js";
import type { IListViewModel } from "@webiny/app-admin/presentation/listPresenter/abstractions.js";
import type { IListActions } from "@webiny/app-admin/presentation/listPresenter/abstractions.js";
import type { IFolderTreeViewModel } from "@webiny/app-aco/presentation/folderTree/abstractions.js";
import type { FolderDto } from "@webiny/app-aco";
import type { IFileDetailsPresenter } from "../FileDetails/abstractions.js";
import type { FmFile } from "../../features/shared/types.js";
import type { FmTag } from "../../features/shared/types.js";
import type { UploadJob } from "../../features/fileUploader/abstractions.js";

// ---------------------------------------------------------------------------
// Init config passed to presenter.init().
// ---------------------------------------------------------------------------

export interface IFileManagerInitConfig {
    initialFolderId?: string;
    scope?: string;
}

// ---------------------------------------------------------------------------
// FileManagerViewModel
// ---------------------------------------------------------------------------

export interface IFileManagerViewModel {
    fileModel: CmsModel | null;
    list: IListViewModel<FmFile>;
    folders: IFolderTreeViewModel;
    fileDetails: IFileDetailsPresenter | null;
    tags: FmTag[];
    upload: {
        jobs: UploadJob[];
        overallProgress: { percentage: number; bytesSent: number; totalBytes: number };
        isUploading: boolean;
    };
    loading: boolean;
    empty: boolean;
    showFolders: boolean;
    childFolders: FolderDto[];
    viewMode: "table" | "grid";
    dragging: boolean;
    showingFilters: boolean;
    permissions: {
        canRead: boolean;
        canCreate: boolean;
        canEdit: boolean;
        canDelete: boolean;
        canEditFile: (file: FmFile) => boolean;
        canDeleteFile: (file: FmFile) => boolean;
    };
}

// ---------------------------------------------------------------------------
// Folder actions exposed by the FileManagerPresenter.
// ---------------------------------------------------------------------------

export interface IFolderActions {
    selectFolder(folderId: string | null): void;
    createFolder(parentFolderId?: string): void;
    editFolder(folderId: string): void;
    deleteFolder(folderId: string): Promise<void>;
    moveFolder(folderId: string, targetParentId: string | null): Promise<void>;
    loadChildFolders(parentIds: string[]): Promise<void>;
    canManageStructure(folderId: string): boolean;
    getAncestorIds(folderId: string): string[];
    submitOperation(): Promise<boolean>;
    cancelOperation(): void;
}

// ---------------------------------------------------------------------------
// FileManagerPresenter actions (extends ListActions with domain-specific actions).
// ---------------------------------------------------------------------------

export interface IFileManagerActions extends IListActions {
    showFileDetails(id: string): void;
    hideFileDetails(): void;
    upload(files: SelectedFile[]): Promise<void>;
    setViewMode(mode: "table" | "grid"): void;
    setDragging(dragging: boolean): void;
    showFilters(): void;
    hideFilters(): void;
    folders: IFolderActions;
}

// ---------------------------------------------------------------------------
// IFileManagerPresenter
// ---------------------------------------------------------------------------

export interface IFileManagerPresenter {
    vm: IFileManagerViewModel;
    actions: IFileManagerActions;
    init(config?: IFileManagerInitConfig): void;
    dispose(): void;
}

export const FileManagerPresenter =
    createAbstraction<IFileManagerPresenter>("FileManagerPresenter");

export namespace FileManagerPresenter {
    export type Interface = IFileManagerPresenter;
    export type ViewModel = IFileManagerViewModel;
    export type Actions = IFileManagerActions;
    export type InitConfig = IFileManagerInitConfig;
}
