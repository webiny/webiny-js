import type { CmsEntry } from "@webiny/api-headless-cms/types";
import type { Theme, ThemeRevision } from "./abstractions.js";

export class EntryToThemeMapper {
    static toTheme(entry: CmsEntry): Theme {
        return {
            id: entry.id,
            entryId: entry.entryId,
            status: entry.status,
            version: entry.version,
            locked: entry.locked,
            live: entry.live,
            createdOn: entry.createdOn,
            createdBy: entry.createdBy,
            savedOn: entry.savedOn,
            savedBy: entry.savedBy,
            modifiedOn: entry.modifiedOn ?? null,
            modifiedBy: entry.modifiedBy ?? null,
            firstPublishedOn: entry.firstPublishedOn ?? null,
            lastPublishedOn: entry.lastPublishedOn ?? null,
            tenant: entry.tenant,
            properties: entry.values.properties,
            tokens: entry.values.tokens,
            policy: entry.values.policy,
            settings: entry.values.settings,
            resolved: entry.values.resolved ?? null,
            metadata: entry.values.metadata ?? {},
            extensions: entry.values.extensions ?? {}
        };
    }

    static toRevision(entry: CmsEntry): ThemeRevision {
        return {
            id: entry.id,
            entryId: entry.entryId,
            version: entry.version,
            name: entry.values.properties?.name ?? "",
            status: entry.status,
            locked: entry.locked,
            savedOn: entry.savedOn,
            createdOn: entry.createdOn,
            createdBy: entry.createdBy,
            lastPublishedOn: entry.lastPublishedOn ?? null,
            publishComment: entry.values.publishComment ?? null
        };
    }
}
