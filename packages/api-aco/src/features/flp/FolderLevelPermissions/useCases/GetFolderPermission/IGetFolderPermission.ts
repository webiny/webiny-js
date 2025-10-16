import type { FolderLevelPermission } from "~/flp/flp.types.js";

export interface IGetFolderPermission {
    execute: (id: string) => Promise<FolderLevelPermission | null>;
}
