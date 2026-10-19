import type { CmsEntry } from "@webiny/api-headless-cms/types/index.js";
import type { AdminExtension } from "./AdminExtension.js";
import type { AdminExtensionValues } from "./AdminExtension.js";

export function mapEntryToAdminExtension(entry: CmsEntry<AdminExtensionValues>): AdminExtension {
    const values = entry.values;

    return {
        id: entry.entryId,
        createdOn: entry.createdOn,
        savedOn: entry.savedOn,
        kind: values.kind,
        name: values.name,
        label: values.label,
        description: values.description ?? "",
        enabled: values.enabled !== false,
        runtimeVersion: values.runtimeVersion,
        source: values.source ?? "",
        config: values.config ?? "",
        compiled: values.compiled ?? ""
    };
}
