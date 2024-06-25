import { FolderItem } from "~/types";

export interface ICreateFolderGateway {
    execute: (folder: FolderItem) => Promise<FolderItem>;
}
