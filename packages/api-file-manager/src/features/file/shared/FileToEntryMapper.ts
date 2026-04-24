import type { CmsEntry } from "@webiny/api-headless-cms/types";
import type { File } from "~/domain/file/types.js";

export class FileToEntryMapper {
    static toEntry(file: File): Partial<CmsEntry> {
        return {
            id: `${file.id}#0001`,
            entryId: file.id,
            createdOn: file.createdOn,
            modifiedOn: file.modifiedOn,
            savedOn: file.savedOn,
            createdBy: file.createdBy,
            modifiedBy: file.modifiedBy,
            savedBy: file.savedBy,
            location: file.location || { folderId: "root" },
            values: {
                name: file.name,
                key: file.key,
                size: file.size,
                type: file.type,
                metadata: file.metadata || {},
                accessControl: file.accessControl,
                tags: file.tags || [],
                description: file.description ?? "",
                extensions: file.extensions
            }
        };
    }
}
