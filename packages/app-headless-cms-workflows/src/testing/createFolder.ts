import type { FolderDto } from "@webiny/app-aco/domain/folder/FolderDto.js";
import { RootFolder } from "@webiny/app-aco/domain/folder/RootFolder.js";

/*
 * An ACO folder as `ListFoldersGateway` returns it: the root folder's shape with this folder's
 * id, title and parent.
 */
export const createFolder = (id: string, title: string, parentId: string | null): FolderDto => {
    return {
        ...RootFolder.create(),
        id,
        title,
        slug: title.toLowerCase(),
        type: "cms:article",
        parentId,
        path: `/${title.toLowerCase()}`
    };
};
