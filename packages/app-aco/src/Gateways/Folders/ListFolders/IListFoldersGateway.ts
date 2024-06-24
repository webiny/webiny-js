import { FolderDTO } from "~/Domain/Models";

export interface IListFoldersGateway {
    execute: (type: string) => Promise<FolderDTO[]>;
}
