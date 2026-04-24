import { EntryId } from "@webiny/api-headless-cms/exports/api/cms/entry.js";

export class TenantId {
    static from(id?: string) {
        if (id) {
            // Ensure we have a clean id, without the revision suffix.
            return EntryId.from(id).id;
        }

        return EntryId.create().id;
    }
}
