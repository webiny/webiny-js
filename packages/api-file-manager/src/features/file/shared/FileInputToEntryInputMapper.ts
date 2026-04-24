import type { CreateCmsEntryInput } from "@webiny/api-headless-cms/types";
import type { FileInput } from "~/domain/file/types.js";

export class FileInputToEntryInputMapper {
    static toEntry(file: FileInput): CreateCmsEntryInput {
        return {
            id: file.id,
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
                accessControl: {
                    type: "public"
                },
                tags: file.tags || [],
                description: file.description ?? "",
                extensions: file.extensions
            }
        };
    }
}
