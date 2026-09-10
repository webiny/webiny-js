"use client";

import { useEntryStore } from "./EntryStoreProvider.js";
import type { CmsEntry, CmsEntryValues } from "@webiny/cms-sdk";

export function useEntry<T extends CmsEntryValues = CmsEntryValues>(): CmsEntry<T> | null {
    const store = useEntryStore();
    return store.getEntry() as CmsEntry<T> | null;
}
