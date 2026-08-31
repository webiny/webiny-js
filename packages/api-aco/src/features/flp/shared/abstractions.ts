import { createAbstraction } from "@webiny/feature/api";
import type { FolderAccessLevel, FolderPermission } from "~/flp/flp.types.js";

export interface CodeFolderPermission {
    target: `admin:${string}` | `team:${string}`;
    level: FolderAccessLevel;
}

export type CodeFlp = {
    /**
     * Folder type the rule applies to, e.g. `FmFile` or a Headless CMS model's folder type.
     */
    type: string;
    /**
     * Folder path the rule binds to. The leading `root` segment is optional, so both `/marketing`
     * and `root/marketing` are accepted. A trailing `/*` matches the folder and its whole subtree.
     */
    path: string;
    permissions: CodeFolderPermission[];
};

export interface IFlpFactory {
    execute(): Promise<CodeFlp[]>;
}

/** Provide code-defined folder-level permissions. */
export const FlpFactory = createAbstraction<IFlpFactory>("FlpFactory");

export namespace FlpFactory {
    export type Interface = IFlpFactory;
    export type Return = Promise<CodeFlp[]>;
    export type Flp = CodeFlp;
    export type Permission = CodeFolderPermission;
}

export interface GetCodePermissionsParams {
    type: string;
    path: string;
}

export interface IFlpsProvider {
    /**
     * Return all code-defined permissions that apply to the given folder type and path.
     */
    getPermissions(params: GetCodePermissionsParams): Promise<FolderPermission[]>;
}

/** Resolve code-defined folder-level permissions for a given folder. */
export const FlpsProvider = createAbstraction<IFlpsProvider>("FlpsProvider");

export namespace FlpsProvider {
    export type Interface = IFlpsProvider;
}
