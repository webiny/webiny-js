import { createAbstraction, Result } from "@webiny/feature/api";
import type {
    FolderLevelPermissionsTarget,
    FolderLevelPermissionsTargetListMeta
} from "~/folder/folder.types.js";

// Use Case Abstraction
export interface IListFolderLevelPermissionsTargetsUseCase {
    execute: () => Promise<
        Result<[FolderLevelPermissionsTarget[], FolderLevelPermissionsTargetListMeta]>
    >;
}

/** List targets for folder-level permissions. */
export const ListFolderLevelPermissionsTargetsUseCase =
    createAbstraction<IListFolderLevelPermissionsTargetsUseCase>(
        "ListFolderLevelPermissionsTargetsUseCase"
    );

export namespace ListFolderLevelPermissionsTargetsUseCase {
    export type Interface = IListFolderLevelPermissionsTargetsUseCase;
    export type Return = Promise<
        Result<[FolderLevelPermissionsTarget[], FolderLevelPermissionsTargetListMeta]>
    >;
}
