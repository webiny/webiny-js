import { FolderItem } from "~/types";

export interface IUpdateFolderRepository {
    execute: (folder: FolderItem) => Promise<void>;
}
