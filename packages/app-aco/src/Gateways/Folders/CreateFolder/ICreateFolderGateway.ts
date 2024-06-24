import { FolderDTO } from "~/Domain/Models";

export interface ICreateFolderGateway {
    execute: (folder: FolderDTO) => Promise<FolderDTO>;
}
