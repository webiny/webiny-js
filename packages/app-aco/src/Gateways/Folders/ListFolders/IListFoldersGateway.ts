import { FolderItem } from "~/types";

export interface IListFoldersGateway {
    execute: (type: string) => Promise<FolderItem[]>;
}
