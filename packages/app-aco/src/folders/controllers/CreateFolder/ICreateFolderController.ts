import { FolderItem } from "~/types";

export interface ICreateFolderController {
    execute: (folder: FolderItem, type: string) => Promise<void>;
}
