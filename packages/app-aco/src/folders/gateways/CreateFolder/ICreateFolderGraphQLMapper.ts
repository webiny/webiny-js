import { Folder } from "~/folders/domain";
import { FolderPermission } from "~/types";

export interface CreateFolderGraphQLDTO {
    title: string;
    slug: string;
    permissions: FolderPermission[];
    type: string;
    parentId: string | null;
}

export interface ICreateFolderGraphQLMapper {
    toGraphQLDTO: (folder: Folder) => CreateFolderGraphQLDTO;
}
