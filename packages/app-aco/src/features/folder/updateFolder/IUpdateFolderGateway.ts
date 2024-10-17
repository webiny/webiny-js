import { FolderDto } from "./FolderDto";
import { FolderGqlDto } from "./FolderGqlDto";

export interface IUpdateFolderGateway {
    execute: (folder: FolderDto) => Promise<FolderGqlDto>;
}
