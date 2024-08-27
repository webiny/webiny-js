import { CreateFolderGraphQLDTO } from "./ICreateFolderGraphQLMapper";
import { FolderItem } from "~/types";

export interface ICreateFolderGateway {
    execute: (folderDTO: CreateFolderGraphQLDTO) => Promise<FolderItem>;
}
