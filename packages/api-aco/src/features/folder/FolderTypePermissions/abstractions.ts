import { createAbstraction } from "@webiny/feature/api";

/**
 * App permissions for folders of a given type. Each app that uses folders (File Manager,
 * Website Builder, Headless CMS) registers an implementation for its folder types. These checks
 * come on top of folder level permissions. Folder types no app handles are not restricted.
 */
export interface IFolderTypePermissions {
    canHandle(type: string): boolean;
    canRead(type: string): Promise<boolean>;
    canWrite(type: string): Promise<boolean>;
}

export const FolderTypePermissions = createAbstraction<IFolderTypePermissions>(
    "Aco/FolderTypePermissions"
);

export namespace FolderTypePermissions {
    export type Interface = IFolderTypePermissions;
}

/** Resolves the implementation for a folder type and runs its checks. */
export interface IFolderTypeAccess {
    canRead(type: string): Promise<boolean>;
    canWrite(type: string): Promise<boolean>;
}

export const FolderTypeAccess = createAbstraction<IFolderTypeAccess>("Aco/FolderTypeAccess");

export namespace FolderTypeAccess {
    export type Interface = IFolderTypeAccess;
}
