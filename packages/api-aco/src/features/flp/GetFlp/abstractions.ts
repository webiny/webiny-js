import { createAbstraction } from "@webiny/feature/api";
import type { FolderLevelPermission } from "~/types.js";

export interface IGetFolderPermission {
    execute: (id: string) => Promise<FolderLevelPermission | null>;
}

export const GetFlpUseCase = createAbstraction<IGetFolderPermission>("GetFlpUseCase");

export namespace GetFlpUseCase {
    export type Interface = IGetFolderPermission;
}
