import type { CmsEntry } from "@webiny/api-headless-cms/types";
import type { File } from "~/domain/file/types.js";

export class EntryToFileMapper {
    static toFile(entry: CmsEntry): File {
        return {
            id: entry.entryId,
            createdOn: entry.createdOn,
            modifiedOn: entry.modifiedOn ?? undefined,
            savedOn: entry.savedOn,
            createdBy: entry.createdBy,
            modifiedBy: entry.modifiedBy ?? undefined,
            savedBy: entry.savedBy,
            name: entry.values.name,
            key: entry.values.key,
            size: entry.values.size,
            type: entry.values.type,
            metadata: entry.values.metadata || {},
            accessControl: entry.values.accessControl,
            location: { folderId: entry.location?.folderId ?? "root" },
            tags: entry.values.tags || [],
            extensions: entry.values.extensions
        };
    }
}
