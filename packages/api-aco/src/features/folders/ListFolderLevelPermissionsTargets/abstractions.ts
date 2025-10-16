import { createAbstraction } from "@webiny/feature/api";
import type {
    FolderLevelPermissionsTarget,
    FolderLevelPermissionsTargetListMeta
} from "~/folder/folder.types.js";
import type { AdminUser } from "@webiny/api-admin-users/types.js";
import type { Team } from "@webiny/api-security/types.js";

// Use Case Abstraction
export interface IListFolderLevelPermissionsTargetsUseCase {
    execute: () => Promise<[FolderLevelPermissionsTarget[], FolderLevelPermissionsTargetListMeta]>;
}

export const ListFolderLevelPermissionsTargetsUseCase =
    createAbstraction<IListFolderLevelPermissionsTargetsUseCase>(
        "ListFolderLevelPermissionsTargetsUseCase"
    );

export namespace ListFolderLevelPermissionsTargetsUseCase {
    export type Interface = IListFolderLevelPermissionsTargetsUseCase;
}

// Gateway Abstractions
export interface IListAdminUsersGateway {
    execute: () => Promise<AdminUser[]>;
}

export const ListAdminUsersGateway =
    createAbstraction<IListAdminUsersGateway>("ListAdminUsersGateway");

export namespace ListAdminUsersGateway {
    export type Interface = IListAdminUsersGateway;
}

export interface IListTeamsGateway {
    execute: () => Promise<Team[]>;
}

export const ListTeamsGateway = createAbstraction<IListTeamsGateway>("ListTeamsGateway");

export namespace ListTeamsGateway {
    export type Interface = IListTeamsGateway;
}
