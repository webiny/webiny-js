import type { CmsEntry } from "@webiny/api-headless-cms/types";
import type {
    CmsEntryWbVariantValues,
    VariantStatus,
    WbVariant
} from "~/domain/variant/abstractions.js";

export class EntryToVariantMapper {
    static toVariant(entry: CmsEntry<CmsEntryWbVariantValues>): WbVariant {
        const values = entry.values;
        return {
            id: entry.id,
            entryId: entry.entryId,
            version: entry.version,
            locked: entry.locked,
            createdOn: entry.createdOn,
            createdBy: entry.createdBy,
            savedOn: entry.savedOn,
            savedBy: entry.savedBy,
            tenant: entry.tenant,
            experimentId: values.experimentId,
            name: values.name || "",
            status: (values.status as VariantStatus) || "draft",
            properties: values.properties ?? {},
            metadata: values.metadata ?? {},
            bindings: values.bindings ?? {},
            elements: values.elements ?? {},
            extensions: values.extensions ?? {}
        };
    }
}
