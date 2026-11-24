import { createAbstraction, Result } from "@webiny/feature/api";
import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";
import type { NotAuthorizedError } from "@webiny/api-core/features/security/shared/errors.js";
import type { FolderAccessLevel, FolderLevelPermission } from "~/flp/flp.types.js";

export interface FolderAccessUser {
    id: string;
    displayName: string;
    email: string;
    /** The level the user ends up with; never `no-access`. */
    level: FolderAccessLevel;
    /**
     * Where the level comes from: `direct` (a grant to the user on the folder),
     * `parent:<folderId>` (a grant to the user inherited from an ancestor), `team:<slug>` (one of
     * the user's teams) or `role:full-access` (full access is owner everywhere).
     */
    via: string;
}

export interface FolderAccessTeam {
    /** Missing when the grant names a team that does not exist (any more). */
    id?: string;
    slug: string;
    name?: string;
    level: FolderAccessLevel;
    /** `parent:<folderId>` when inherited from an ancestor; missing for a grant on the folder. */
    inheritedFrom?: string;
}

export interface FolderAccess {
    folderId: string | null;
    /**
     * False when no folder-level restriction applies: no folder or the root folder, a folder without
     * any permissions, or folder-level permissions turned off. Everyone who can access the content
     * model can then access it, and `users` and `teams` are empty.
     */
    restricted: boolean;
    /** Users who can at least read the folder's content. */
    users: FolderAccessUser[];
    /** Teams granted at least read access. Their members are included in `users`. */
    teams: FolderAccessTeam[];
}

export interface IListFolderAccessUseCase {
    /**
     * Who can access the content of a folder, by folder-level permissions. Only content-model
     * permissions beyond full access are not considered: a listed user still needs access to the
     * model itself. Requires being able to manage the folder's permissions.
     */
    execute(folderId: string | null): Promise<Result<FolderAccess, NotAuthorizedError>>;
}

/** List the users and teams who can access a folder's content. */
export const ListFolderAccessUseCase =
    createAbstraction<IListFolderAccessUseCase>("ListFolderAccessUseCase");

export namespace ListFolderAccessUseCase {
    export type Interface = IListFolderAccessUseCase;
    export type Return = Promise<Result<FolderAccess, NotAuthorizedError>>;
}

export interface IListEntryAccessUseCase {
    /** `ListFolderAccessUseCase` for the folder the entry's latest revision is in. */
    execute(model: CmsModel, entryId: string): Promise<Result<FolderAccess, Error>>;
}

/** List the users and teams who can access an entry, by the folder it is in. */
export const ListEntryAccessUseCase =
    createAbstraction<IListEntryAccessUseCase>("ListEntryAccessUseCase");

export namespace ListEntryAccessUseCase {
    export type Interface = IListEntryAccessUseCase;
    export type Return = Promise<Result<FolderAccess, Error>>;
}

export interface UserFolderAccessFolder {
    id: string;
    slug: string;
    path: string;
    parentId: string;
    /** Never `no-access`. `public` for a folder without any permissions. */
    level: FolderAccessLevel;
    /** `direct`, `parent:<folderId>`, `team:<slug>`, `role:full-access` or `public`. */
    via: string;
}

export interface UserFolderAccess {
    userId: string;
    type: string;
    /**
     * False when folder-level permissions are turned off: the user can access every folder of the
     * type, and `folders` is empty.
     */
    restricted: boolean;
    /** The folders of the type whose content the user can at least read. */
    folders: UserFolderAccessFolder[];
}

export interface ListUserFolderAccessParams {
    userId: string;
    /** Folder type, e.g. `cms:<modelId>` or `FmFile`. */
    type: string;
    /** Only the children of this folder. */
    parentId?: string;
}

export interface IListUserFolderAccessUseCase {
    /**
     * The folders a user can access, by folder-level permissions (the reverse of
     * `ListFolderAccessUseCase`). An identity may ask about itself; asking about another user
     * requires full access.
     */
    execute(params: ListUserFolderAccessParams): Promise<Result<UserFolderAccess, Error>>;
}

/** List the folders a user can access. */
export const ListUserFolderAccessUseCase = createAbstraction<IListUserFolderAccessUseCase>(
    "ListUserFolderAccessUseCase"
);

export namespace ListUserFolderAccessUseCase {
    export type Interface = IListUserFolderAccessUseCase;
    export type Params = ListUserFolderAccessParams;
    export type Return = Promise<Result<UserFolderAccess, Error>>;
}

export interface ListUserFolderCandidatesParams {
    type: string;
    parentId?: string;
    /** The user's permission targets: `admin:<id>` and `team:<slug>` for each of their teams. */
    targets: string[];
}

export interface IUserFolderCandidates {
    /**
     * The folders of the type (or a parent's children) a user holding these targets might be able
     * to access, with their permissions as `ListFlpsUseCase` returns them. It may return folders
     * the user cannot access, but never leaves out one they can: the caller checks every folder.
     */
    list(params: ListUserFolderCandidatesParams): Promise<FolderLevelPermission[]>;
}

/**
 * Narrows the folders `ListUserFolderAccessUseCase` checks. The default returns every folder of the
 * type; a storage with an index of grants by target can return only the ones that matter.
 */
export const UserFolderCandidates = createAbstraction<IUserFolderCandidates>(
    "Aco/UserFolderCandidates"
);

export namespace UserFolderCandidates {
    export type Interface = IUserFolderCandidates;
    export type Params = ListUserFolderCandidatesParams;
}

export interface UserAccessCheck {
    userId: string;
    /** The folder that decides access: the one asked about, or the one the entry is in. */
    folderId: string | null;
    /**
     * False when no folder-level restriction applies: no folder or the root folder, a folder
     * without any permissions, or folder-level permissions turned off. The user can then access it
     * whenever they can access the content model, and `canAccess` is true.
     */
    restricted: boolean;
    /** Whether the user can at least read the content. */
    canAccess: boolean;
    /** The user's level when restricted and `canAccess`; never `no-access`. */
    level?: FolderAccessLevel;
    /** `direct`, `parent:<folderId>`, `team:<slug>` or `role:full-access`. */
    via?: string;
}

export interface GetUserFolderAccessParams {
    userId: string;
    folderId: string | null;
}

export interface IGetUserFolderAccessUseCase {
    /**
     * Whether one user can access a folder's content, by folder-level permissions, with the level
     * and where it comes from: the same answer `ListFolderAccessUseCase` gives for that user,
     * without going through every user. Content-model permissions beyond full access are not
     * considered. An identity may ask about itself; asking about another user requires full access.
     */
    execute(params: GetUserFolderAccessParams): Promise<Result<UserAccessCheck, Error>>;
}

/** Check whether a user can access a folder's content. */
export const GetUserFolderAccessUseCase = createAbstraction<IGetUserFolderAccessUseCase>(
    "GetUserFolderAccessUseCase"
);

export namespace GetUserFolderAccessUseCase {
    export type Interface = IGetUserFolderAccessUseCase;
    export type Params = GetUserFolderAccessParams;
    export type Return = Promise<Result<UserAccessCheck, Error>>;
}

export interface GetUserEntryAccessParams {
    userId: string;
    model: CmsModel;
    entryId: string;
}

export interface IGetUserEntryAccessUseCase {
    /** `GetUserFolderAccessUseCase` for the folder the entry's latest revision is in. */
    execute(params: GetUserEntryAccessParams): Promise<Result<UserAccessCheck, Error>>;
}

/** Check whether a user can access an entry, by the folder it is in. */
export const GetUserEntryAccessUseCase = createAbstraction<IGetUserEntryAccessUseCase>(
    "GetUserEntryAccessUseCase"
);

export namespace GetUserEntryAccessUseCase {
    export type Interface = IGetUserEntryAccessUseCase;
    export type Params = GetUserEntryAccessParams;
    export type Return = Promise<Result<UserAccessCheck, Error>>;
}
