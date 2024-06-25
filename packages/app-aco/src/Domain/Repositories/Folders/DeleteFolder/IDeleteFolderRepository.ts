import { FolderItem } from "~/types";

export interface IDeleteFolderRepository {
    execute: (folder: FolderItem) => Promise<void>;
}
