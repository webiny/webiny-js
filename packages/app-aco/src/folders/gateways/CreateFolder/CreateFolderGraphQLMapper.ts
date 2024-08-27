import { Folder } from "~/folders/domain";
import { ICreateFolderGraphQLMapper } from "./ICreateFolderGraphQLMapper";

export class CreateFolderGraphQLMapper implements ICreateFolderGraphQLMapper {
    toGraphQLDTO(folder: Folder) {
        return {
            title: folder.title,
            slug: folder.slug,
            permissions: folder.permissions,
            parentId: folder.parentId,
            type: folder.type
        };
    }
}
