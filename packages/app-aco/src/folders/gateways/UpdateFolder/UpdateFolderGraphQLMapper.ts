import { Folder } from "~/folders/domain";
import { IUpdateFolderGraphQLMapper } from "./IUpdateFolderGraphQLMapper";

export class UpdateFolderGraphQLMapper implements IUpdateFolderGraphQLMapper {
    toGraphQLDTO(folder: Folder) {
        return {
            id: folder.id,
            title: folder.title,
            slug: folder.slug,
            permissions: folder.permissions,
            parentId: folder.parentId
        };
    }
}
