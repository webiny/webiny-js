import { FolderItem } from "~/types";

export interface ICreateFolderRepository {
    execute: (folder: FolderItem) => Promise<void>;
}
