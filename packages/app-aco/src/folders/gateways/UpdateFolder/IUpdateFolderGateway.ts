import { UpdateFolderGraphQLDTO } from "./IUpdateFolderGraphQLMapper";
import { FolderItem } from "~/types";

export interface IUpdateFolderGateway {
    execute: (folder: UpdateFolderGraphQLDTO) => Promise<FolderItem>;
}
