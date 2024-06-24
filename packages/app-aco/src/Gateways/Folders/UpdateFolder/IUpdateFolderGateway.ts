import { FolderDTO } from "~/Domain/Models";

export interface IUpdateFolderGateway {
    execute: (folder: FolderDTO) => Promise<FolderDTO>;
}
