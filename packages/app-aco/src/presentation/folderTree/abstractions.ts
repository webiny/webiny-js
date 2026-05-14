import { createAbstraction } from "@webiny/feature/admin";
import type { FormModel } from "@webiny/app-admin/features/formModel/abstractions.js";
import type { FolderDto } from "~/domain/folder/FolderDto.js";

// ---------------------------------------------------------------------------
// FolderTreeNode
// ---------------------------------------------------------------------------

export interface IFolderTreeNode {
    id: string;
    name: string;
    slug: string;
    parentId: string | null;
    children: IFolderTreeNode[];
    hasNonInheritedPermissions: boolean;
    canManagePermissions: boolean;
    canManageStructure: boolean;
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
    folders: FolderDto[];
    tree: IFolderTreeNode[];
    currentFolderId: string | null;
    currentFolder: FolderDto | null;
    isRootFolder: boolean;
    currentFolderTitle: string;
    childFolders: FolderDto[];
    loading: boolean;
    loadingNodeIds: string[];
    operation: IFolderOperationState;
}

// ---------------------------------------------------------------------------
// IFolderTreeCallbacks — action callbacks for the tree component.
// ---------------------------------------------------------------------------

export interface IFolderTreeCallbacks {
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
// IFolderTreePresenter
// ---------------------------------------------------------------------------

export interface IFolderTreePresenter {
    vm: IFolderTreeViewModel;
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
    onFolderChange(callback: (folderId: string | null) => void): () => void;
}

export const FolderTreePresenter = createAbstraction<IFolderTreePresenter>("FolderTreePresenter");

export namespace FolderTreePresenter {
    export type Interface = IFolderTreePresenter;
    export type ViewModel = IFolderTreeViewModel;
    export type Node = IFolderTreeNode;
    export type OperationState = IFolderOperationState;
    export type Callbacks = IFolderTreeCallbacks;
}
