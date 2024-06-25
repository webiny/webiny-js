import { FolderItem } from "~/types";

export interface IGetFolderGateway {
    execute: (id: string) => Promise<FolderItem>;
}
