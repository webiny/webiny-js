"use client";

import { observer } from "mobx-react-lite";
import { useEntryStore } from "./EntryStoreProvider.js";
import type { CmsEntryValues } from "@webiny/cms-sdk";

export function useEntryValues<T extends CmsEntryValues = CmsEntryValues>(): T | null {
    const store = useEntryStore();
    return store.getValues() as T | null;
}
