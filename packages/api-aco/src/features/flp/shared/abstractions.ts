import { createAbstraction } from "@webiny/feature/api";
import { FM_FILE_TYPE } from "~/constants.js";
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
     * Folder type the rule applies to. Use `FlpFactory.FolderType` to build the built-in ones
     * instead of writing the string by hand.
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

/**
 * The folder types shipped with Webiny, grouped by the app that owns them, so `CodeFlp.type` does
 * not have to be written by hand.
 *
 * Folder types stay open-ended — every app registering folders picks its own type — so `type`
 * remains a plain `string` and a custom app can still pass its own value directly.
 */
const FolderType = {
    /** File Manager folders. */
    FileManager: {
        /** Folders holding files. */
        Files: FM_FILE_TYPE as string
    },
    /** Headless CMS folders. */
    Cms: {
        /** Folders holding entries of a content model, addressed by its `modelId`. */
        Model(modelId: string): string {
            return `cms:${modelId}`;
        }
    }
};

/** Provide code-defined folder-level permissions. */
export const FlpFactory = Object.assign(createAbstraction<IFlpFactory>("FlpFactory"), {
    FolderType
});

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
