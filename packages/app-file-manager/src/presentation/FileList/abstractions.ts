import { createAbstraction } from "@webiny/feature/admin";
import type { IListViewModel } from "@webiny/app-admin/presentation/listPresenter/abstractions.js";
import type { IListActions } from "@webiny/app-admin/presentation/listPresenter/abstractions.js";
import type { IFolderTreeViewModel } from "@webiny/app-aco/presentation/folderTree/abstractions.js";
import type { FmFile } from "../../features/shared/types.js";
import type { FmTag } from "../../features/shared/types.js";
import type { UploadJob } from "../../features/fileUploader/abstractions.js";

// ---------------------------------------------------------------------------
// Overlay configuration passed to init() for file picker mode.
// ---------------------------------------------------------------------------

export interface IFileListOverlayConfig {
    onChange: (files: FmFile[]) => void;
    onClose: () => void;
    multiple?: boolean;
    accept?: string[];
    scope?: string;
}

// ---------------------------------------------------------------------------
// FileListViewModel
// ---------------------------------------------------------------------------

export interface IFileListViewModel {
    list: IListViewModel<FmFile>;
    folders: IFolderTreeViewModel;
    permissions: {
        canRead: boolean;
        canCreate: boolean;
        canEdit: boolean;
        canDelete: boolean;
    };
    upload: {
        jobs: UploadJob[];
        overallProgress: { percentage: number; bytesSent: number; totalBytes: number };
        isUploading: boolean;
    };
    tags: FmTag[];
    viewMode: "table" | "grid";
    dragging: boolean;
    isOverlay: boolean;
}

// ---------------------------------------------------------------------------
// Folder actions exposed by the FileListPresenter.
// ---------------------------------------------------------------------------

export interface IFolderActions {
    selectFolder(folderId: string | null): void;
    createFolder(parentFolderId?: string): void;
    editFolder(folderId: string): void;
    deleteFolder(folderId: string): Promise<void>;
    cancelOperation(): void;
}

// ---------------------------------------------------------------------------
// FileListPresenter actions (extends ListActions with domain-specific actions).
// ---------------------------------------------------------------------------

export interface IFileListActions extends IListActions {
    upload(files: File[]): Promise<void>;
    setViewMode(mode: "table" | "grid"): void;
    selectFile(file: FmFile): void;
    confirmSelection(): void;
    folders: IFolderActions;
}

// ---------------------------------------------------------------------------
// IFileListPresenter
// ---------------------------------------------------------------------------

export interface IFileListPresenter {
    vm: IFileListViewModel;
    actions: IFileListActions;
    init(overlayConfig?: IFileListOverlayConfig): void;
}

export const FileListPresenter = createAbstraction<IFileListPresenter>("FileListPresenter");

export namespace FileListPresenter {
    export type Interface = IFileListPresenter;
    export type ViewModel = IFileListViewModel;
    export type Actions = IFileListActions;
    export type OverlayConfig = IFileListOverlayConfig;
}
