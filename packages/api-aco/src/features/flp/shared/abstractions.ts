import { createAbstraction } from "@webiny/feature/api";
import type { FolderAccessLevel, FolderPermission } from "~/flp/flp.types.js";

interface CodeTeamPermission {
    /** Slug of the team the permission is granted to. */
    team: string;
    user?: never;
    level: FolderAccessLevel;
}

interface CodeUserPermission {
    /** ID of the admin user the permission is granted to. */
    user: string;
    team?: never;
    level: FolderAccessLevel;
}

/**
 * A permission grants a level to exactly one target: either a team or a single admin user. The
 * `team:` / `admin:` target strings used internally are generated from these.
 *
 * Prefer `team` — team slugs are authored by hand and stable, while user IDs are generated at
 * runtime and differ per environment.
 */
export type CodeFolderPermission = CodeTeamPermission | CodeUserPermission;

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

export interface ICodeFlpsProvider {
    /**
     * Return all code-defined permissions that apply to the given folder type and path.
     */
    getPermissions(params: GetCodePermissionsParams): Promise<FolderPermission[]>;
}

/**
 * Resolve code-defined folder-level permissions for a given folder. Only permissions contributed by
 * an `FlpFactory` are considered — the ones stored in the database are loaded separately.
 */
export const CodeFlpsProvider = createAbstraction<ICodeFlpsProvider>("CodeFlpsProvider");

export namespace CodeFlpsProvider {
    export type Interface = ICodeFlpsProvider;
}
