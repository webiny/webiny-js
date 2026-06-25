import { createAbstraction } from "@webiny/feature/admin";
import type { FolderLevelPermissionsTarget } from "@webiny/app-aco";

export interface IListFolderPermissionsTargetsGateway {
    execute(): Promise<FolderLevelPermissionsTarget[]>;
}

export const ListFolderPermissionsTargetsGateway =
    createAbstraction<IListFolderPermissionsTargetsGateway>("ListFolderPermissionsTargetsGateway");

export namespace ListFolderPermissionsTargetsGateway {
    export type Interface = IListFolderPermissionsTargetsGateway;
}

export interface IListFolderPermissionsTargetsUseCase {
    execute(): Promise<FolderLevelPermissionsTarget[]>;
}

export const ListFolderPermissionsTargetsUseCase =
    createAbstraction<IListFolderPermissionsTargetsUseCase>("ListFolderPermissionsTargetsUseCase");

export namespace ListFolderPermissionsTargetsUseCase {
    export type Interface = IListFolderPermissionsTargetsUseCase;
}
