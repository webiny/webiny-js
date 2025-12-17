import type { CmsEntry } from "@webiny/api-headless-cms/types";
import type { Folder } from "~/folder/folder.types.js";

export class EntryToFolderMapper {
    static toFolder(entry: CmsEntry): Folder {
        return {
            id: entry.id,
            entryId: entry.entryId,
            createdOn: entry.createdOn,
            modifiedOn: entry.modifiedOn ?? null,
            savedOn: entry.savedOn,
            createdBy: entry.createdBy,
            modifiedBy: entry.modifiedBy ?? null,
            savedBy: entry.savedBy,
            title: entry.values.title,
            slug: entry.values.slug,
            permissions: entry.values.permissions,
            type: entry.values.type,
            parentId: entry.values.parentId ?? null,
            path: entry.values.path,
            extensions: entry.values.extensions
        };
    }
}
