import { createAbstraction } from "@webiny/feature/api/index.js";
import type { Knex } from "knex";
import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";

export interface EntryValuesPatch {
    entryId: string;
    /** Field values by `fieldId`. Only these fields change; the entry's other values stay. */
    values: Record<string, unknown>;
}

export interface IEntryValuesPatcher {
    /**
     * Overwrites field values on the entries' latest and published rows, inside the caller's
     * transaction. Meant for system-maintained values that a related change makes stale (a folder's
     * `path` after its parent is renamed, say), where going through the CMS for every entry would be
     * far too slow.
     *
     * The search rows are not rebuilt here: call `SearchIndexer.syncEntries` with the returned entry
     * ids in the same transaction. (A `SearchIndexer` decorator that patches entries could not
     * otherwise depend on this.)
     *
     * No lifecycle events run and no meta fields (`savedOn`, ...) change. Values are written as
     * given, so only use it for fields whose stored form is their API form (text, numbers,
     * booleans): fields with a storage transform (compressed long text, ...) would be corrupted.
     */
    patch(trx: Knex.Transaction, model: CmsModel, patches: EntryValuesPatch[]): Promise<string[]>;
}

export const EntryValuesPatcher = createAbstraction<IEntryValuesPatcher>(
    "Cms/Pg/EntryValuesPatcher"
);

export namespace EntryValuesPatcher {
    export type Interface = IEntryValuesPatcher;
    export type Patch = EntryValuesPatch;
}
