import type { CmsEntry } from "@webiny/api-headless-cms/types";
import type { WbRedirect } from "~/domain/redirect/abstractions.js";
import { ROOT_FOLDER } from "~/constants.js";

export class EntryToRedirectMapper {
    static toRedirect(entry: CmsEntry): WbRedirect {
        return {
            id: entry.id,
            location: {
                folderId: entry.location?.folderId ?? ROOT_FOLDER
            },
            createdOn: entry.createdOn,
            createdBy: entry.createdBy,
            savedOn: entry.savedOn,
            savedBy: entry.savedBy,
            modifiedOn: entry.modifiedOn ?? null,
            modifiedBy: entry.modifiedBy ?? null,
            tenant: entry.tenant,
            redirectFrom: entry.values.redirectFrom,
            redirectTo: entry.values.redirectTo,
            redirectType: entry.values.redirectType,
            isEnabled: entry.values.isEnabled
        };
    }
}
