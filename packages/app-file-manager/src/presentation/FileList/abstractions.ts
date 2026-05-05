import { createAbstraction } from "@webiny/feature/admin";
import type { IListViewModel } from "@webiny/app-admin/presentation/listPresenter/abstractions.js";
import type { IListActions } from "@webiny/app-admin/presentation/listPresenter/abstractions.js";
import type { IFolderTreeViewModel } from "@webiny/app-aco/presentation/folderTree/abstractions.js";
import type { IFileDetailsPresenter } from "../FileDetails/abstractions.js";
import type { FmFile } from "../../features/shared/types.js";
import type { FmTag } from "../../features/shared/types.js";
import type { UploadJob } from "../../features/fileUploader/abstractions.js";

// ---------------------------------------------------------------------------
// Overlay configuration passed to init() for file picker mode.
// ---------------------------------------------------------------------------

export interface IFileManagerOverlayConfig {
    onChange: (files: FmFile[]) => void;
    onClose: () => void;
    multiple?: boolean;
    accept?: string[];
    scope?: string;
}

// ---------------------------------------------------------------------------
// FileManagerViewModel
// ---------------------------------------------------------------------------

export interface IFileManagerViewModel {
    list: IListViewModel<FmFile>;
    folders: IFolderTreeViewModel;
    fileDetails: IFileDetailsPresenter | null;
    tags: FmTag[];
    upload: {
        jobs: UploadJob[];
        overallProgress: { percentage: number; bytesSent: number; totalBytes: number };
        isUploading: boolean;
    };
    viewMode: "table" | "grid";
    dragging: boolean;
    showingFilters: boolean;
    permissions: {
        canRead: boolean;
        canCreate: boolean;
        canEdit: boolean;
        canDelete: boolean;
    };
    isOverlay: boolean;
    accept: string[];
    multiple: boolean;
    scope: string | undefined;
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
    upload(files: File[]): Promise<void>;
    setViewMode(mode: "table" | "grid"): void;
    setDragging(dragging: boolean): void;
    showFilters(): void;
    hideFilters(): void;
    selectFile(file: FmFile): void;
    confirmSelection(): void;
    folders: IFolderActions;
}

// ---------------------------------------------------------------------------
// IFileManagerPresenter
// ---------------------------------------------------------------------------

export interface IFileManagerPresenter {
    vm: IFileManagerViewModel;
    actions: IFileManagerActions;
    init(overlayConfig?: IFileManagerOverlayConfig): void;
}

export const FileManagerPresenter =
    createAbstraction<IFileManagerPresenter>("FileManagerPresenter");

export namespace FileManagerPresenter {
    export type Interface = IFileManagerPresenter;
    export type ViewModel = IFileManagerViewModel;
    export type Actions = IFileManagerActions;
    export type OverlayConfig = IFileManagerOverlayConfig;
}
