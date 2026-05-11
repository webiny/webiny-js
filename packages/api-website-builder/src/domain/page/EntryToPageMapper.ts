import type { CmsEntry } from "@webiny/api-headless-cms/types";
import type { WbPage } from "~/domain/page/abstractions.js";
import { ROOT_FOLDER } from "~/constants.js";

export class EntryToPageMapper {
    static toPage(entry: CmsEntry): WbPage {
        return {
            id: entry.id,
            entryId: entry.entryId,
            location: {
                folderId: entry.location?.folderId ?? ROOT_FOLDER
            },
            status: entry.status,
            version: entry.version,
            locked: entry.locked,
            createdOn: entry.createdOn,
            createdBy: entry.createdBy,
            savedOn: entry.savedOn,
            savedBy: entry.savedBy,
            modifiedOn: entry.modifiedOn ?? null,
            modifiedBy: entry.modifiedBy ?? null,
            tenant: entry.tenant,
            system: entry.system,
            live: entry.live,
            revisionDescription: entry.revisionDescription || "",
            deleted: entry.wbyDeleted || false,
            properties: entry.values.properties,
            metadata: entry.values.metadata,
            bindings: entry.values.bindings,
            elements: entry.values.elements,
            extensions: entry.values.extensions
        };
    }
}
