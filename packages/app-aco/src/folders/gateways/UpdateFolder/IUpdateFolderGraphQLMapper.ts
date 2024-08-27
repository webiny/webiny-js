import { Folder } from "~/folders/domain";
import { FolderPermission } from "~/types";

export interface UpdateFolderGraphQLDTO {
    id: string;
    title: string;
    slug: string;
    permissions: FolderPermission[];
    parentId: string | null;
}

export interface IUpdateFolderGraphQLMapper {
    toGraphQLDTO: (folder: Folder) => UpdateFolderGraphQLDTO;
}
