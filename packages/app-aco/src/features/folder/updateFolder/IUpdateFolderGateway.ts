import { FolderDto } from "./FolderDto";

export interface IUpdateFolderGateway {
    execute: (folder: FolderDto) => Promise<void>;
}
