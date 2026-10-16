import type { CmsContentEntry } from "@webiny/app-headless-cms-common/types/index.js";

export function createEntry(overrides: Partial<CmsContentEntry["meta"]> = {}): CmsContentEntry {
    return {
        id: "entry-1#0001",
        entryId: "entry-1",
        modelId: "article",
        meta: {
            title: "Hello",
            status: "draft",
            version: 1,
            locked: false,
            ...overrides
        },
        values: {}
    } as unknown as CmsContentEntry;
}
