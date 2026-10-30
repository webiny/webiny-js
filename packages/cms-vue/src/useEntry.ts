import type { Ref } from "vue";
import { toJS } from "mobx";
import type { CmsEntry, CmsEntryValues } from "@webiny/cms-sdk";
import { useEntryStore } from "./EntryStoreProvider.js";
import { useObservable } from "./useObservable.js";

/**
 * Returns the entry of the closest `EntryRenderer` (or `EntryStoreProvider`) as a ref.
 * In live preview, the ref updates every time the editor changes a field.
 */
export function useEntry<T extends CmsEntryValues = CmsEntryValues>(): Ref<CmsEntry<T> | null> {
    const store = useEntryStore();
    return useObservable(() => {
        const entry = store.getEntry();
        return entry ? (toJS(entry) as CmsEntry<T>) : null;
    });
}
