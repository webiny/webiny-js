import { FolderItem } from "~/types";

export interface IDeleteFolderController {
    execute: (folder: FolderItem) => Promise<void>;
}
