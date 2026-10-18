import type { CmsContentEntry } from "@webiny/app-headless-cms-common/types/index.js";

export const REVISION_SAVED_ON = "2026-10-17T10:00:00.000Z";

export function createEntry(
    overrides: Partial<CmsContentEntry["meta"]> = {},
    fields: Partial<CmsContentEntry> = {}
): CmsContentEntry {
    return {
        id: "entry-1#0001",
        entryId: "entry-1",
        modelId: "article",
        revisionSavedOn: REVISION_SAVED_ON,
        revisionModifiedOn: null,
        meta: {
            title: "Hello",
            status: "draft",
            version: 1,
            locked: false,
            ...overrides
        },
        values: {},
        ...fields
    } as unknown as CmsContentEntry;
}
