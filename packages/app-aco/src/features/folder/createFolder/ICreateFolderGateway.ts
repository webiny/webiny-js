import { FolderDto } from "./FolderDto";
import { FolderGqlDto } from "./FolderGqlDto";

export interface ICreateFolderGateway {
    execute: (folderDto: FolderDto) => Promise<FolderGqlDto>;
}
