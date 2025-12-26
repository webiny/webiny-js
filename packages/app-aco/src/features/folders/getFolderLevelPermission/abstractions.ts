import { createAbstraction } from "@webiny/feature/admin";
import { FolderPermissionName } from "../abstractions.js";

export interface IGetFolderLevelPermissionUseCase {
    execute: (id: string, permissionName: FolderPermissionName) => boolean;
}

export const GetFolderLevelPermissionUseCase = createAbstraction<IGetFolderLevelPermissionUseCase>(
    "GetFolderLevelPermissionUseCase"
);

export namespace GetFolderLevelPermissionUseCase {
    export type Interface = IGetFolderLevelPermissionUseCase;
}
