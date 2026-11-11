import { createAbstraction } from "@webiny/feature/api";
import type { FolderLevelPermission } from "~/types.js";
import type { ListFolderPermissionsParams } from "~/features/flp/FolderPermissionsRepository/abstractions.js";

export interface IListFlps {
    execute: (params: ListFolderPermissionsParams) => Promise<FolderLevelPermission[]>;
}

/** List folder-level permissions. */
export const ListFlpsUseCase = createAbstraction<IListFlps>("ListFlpsUseCase");

export namespace ListFlpsUseCase {
    export type Interface = IListFlps;
    export type Params = ListFolderPermissionsParams;
}
