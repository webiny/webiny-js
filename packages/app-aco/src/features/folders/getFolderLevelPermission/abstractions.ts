import { createAbstraction } from "@webiny/feature/admin";
import type { FolderPermissionName } from "~/features/index.js";

export interface IGetFolderLevelPermissionUseCase {
    execute: (id: string, permissionName: FolderPermissionName) => boolean;
}

export const GetFolderLevelPermissionUseCase = createAbstraction<IGetFolderLevelPermissionUseCase>(
    "GetFolderLevelPermissionUseCase"
);

export namespace GetFolderLevelPermissionUseCase {
    export type Interface = IGetFolderLevelPermissionUseCase;
}
