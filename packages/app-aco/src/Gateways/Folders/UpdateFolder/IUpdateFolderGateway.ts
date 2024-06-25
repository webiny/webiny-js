import { FolderItem } from "~/types";

export interface IUpdateFolderGateway {
    execute: (folder: FolderItem) => Promise<FolderItem>;
}
