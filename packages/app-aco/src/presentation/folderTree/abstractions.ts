import { createAbstraction } from "@webiny/feature/admin";
import type { FormModel } from "@webiny/app-admin/features/formModel/abstractions.js";

// ---------------------------------------------------------------------------
// FolderTreeNode
// ---------------------------------------------------------------------------

export interface IFolderTreeNode {
    id: string;
    name: string;
    slug: string;
    parentId: string | null;
    children: IFolderTreeNode[];
}

// ---------------------------------------------------------------------------
// FolderOperationState
// ---------------------------------------------------------------------------

export interface IFolderOperationState {
    active: boolean;
    mode: "create" | "edit" | "delete" | null;
    folderId?: string;
    parentFolderId?: string;
    form?: FormModel.Interface;
}

// ---------------------------------------------------------------------------
// FolderTreeViewModel
// ---------------------------------------------------------------------------

export interface IFolderTreeViewModel {
    tree: IFolderTreeNode[];
    currentFolderId: string | null;
    currentFolder: IFolderTreeNode | null;
    loading: boolean;
    operation: IFolderOperationState;
}

// ---------------------------------------------------------------------------
// IFolderTreePresenter
// ---------------------------------------------------------------------------

export interface IFolderTreePresenter {
    vm: IFolderTreeViewModel;
    selectFolder(folderId: string | null): void;
    createFolder(parentFolderId?: string): void;
    editFolder(folderId: string): void;
    deleteFolder(folderId: string): Promise<void>;
    cancelOperation(): void;
    onFolderChange(callback: (folderId: string | null) => void): () => void;
}

export const FolderTreePresenter = createAbstraction<IFolderTreePresenter>("FolderTreePresenter");

export namespace FolderTreePresenter {
    export type Interface = IFolderTreePresenter;
    export type ViewModel = IFolderTreeViewModel;
    export type Node = IFolderTreeNode;
    export type OperationState = IFolderOperationState;
}
