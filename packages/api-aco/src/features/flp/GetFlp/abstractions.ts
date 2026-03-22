import { createAbstraction } from "@webiny/feature/api";
import type { FolderLevelPermission } from "~/types.js";

export interface IGetFolderPermission {
    execute: (id: string) => Promise<FolderLevelPermission | null>;
}

/** Retrieve a folder-level permission. */
export const GetFlpUseCase = createAbstraction<IGetFolderPermission>("GetFlpUseCase");

export namespace GetFlpUseCase {
    export type Interface = IGetFolderPermission;
}
