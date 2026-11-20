import type { CmsEntry } from "@webiny/api-headless-cms/types";
import type { CmsEntryWbLayout, Layout } from "./abstractions.js";
import { LayoutDocument } from "./LayoutDocument.js";

// The title of a layout stored without one, so every reader shows the same title.
export const UNTITLED_LAYOUT_TITLE = "Untitled";

export class EntryToLayoutMapper {
    static toLayout(entry: CmsEntry<CmsEntryWbLayout>): Layout {
        const properties: Record<string, any> = EntryToLayoutMapper.isPlainObject(
            entry.values.properties
        )
            ? entry.values.properties
            : {};
        const title =
            typeof properties.title === "string" && properties.title.trim()
                ? properties.title
                : UNTITLED_LAYOUT_TITLE;

        const document = LayoutDocument.fromStored(entry.values.elements, entry.values.bindings);

        return {
            id: entry.id,
            entryId: entry.entryId,
            status: entry.status,
            version: entry.version,
            locked: entry.locked,
            live: entry.live ?? null,
            revisionDescription: entry.revisionDescription || "",
            properties: { ...properties, title },
            metadata: entry.values.metadata ?? {},
            elements: document.elements,
            bindings: document.bindings,
            extensions: entry.values.extensions ?? {},
            createdOn: entry.createdOn,
            savedOn: entry.savedOn,
            modifiedOn: entry.modifiedOn ?? null,
            createdBy: entry.createdBy,
            savedBy: entry.savedBy,
            modifiedBy: entry.modifiedBy ?? null
        };
    }

    private static isPlainObject(value: unknown): value is Record<string, any> {
        return typeof value === "object" && value !== null && !Array.isArray(value);
    }
}
