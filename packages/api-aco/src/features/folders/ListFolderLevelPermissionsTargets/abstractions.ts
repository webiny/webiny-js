import { Abstraction } from "@webiny/di-container";
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
    new Abstraction<IListFolderLevelPermissionsTargetsUseCase>(
        "ListFolderLevelPermissionsTargetsUseCase"
    );

export namespace ListFolderLevelPermissionsTargetsUseCase {
    export type Interface = IListFolderLevelPermissionsTargetsUseCase;
}

// Gateway Abstractions
export interface IListAdminUsersGateway {
    execute: () => Promise<AdminUser[]>;
}

export const ListAdminUsersGateway = new Abstraction<IListAdminUsersGateway>(
    "ListAdminUsersGateway"
);

export namespace ListAdminUsersGateway {
    export type Interface = IListAdminUsersGateway;
}

export interface IListTeamsGateway {
    execute: () => Promise<Team[]>;
}

export const ListTeamsGateway = new Abstraction<IListTeamsGateway>("ListTeamsGateway");

export namespace ListTeamsGateway {
    export type Interface = IListTeamsGateway;
}
