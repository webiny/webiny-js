import { FolderItem } from "~/types";

export interface IUpdateFolderController {
    execute: (folder: FolderItem) => Promise<void>;
}
