import type { CmsEntry } from "~/types/index.js";

export interface EntrySummary {
    id: string;
    entryId: string;
    status: string;
    values: Record<string, unknown>;
}

/** What an entry write tool reports back: enough to refer to the entry and to see what was stored. */
export const toEntrySummary = (entry: CmsEntry): EntrySummary => ({
    id: entry.id,
    entryId: entry.entryId,
    status: entry.status,
    values: entry.values
});
