import type { Ref } from "vue";
import { toJS } from "mobx";
import type { CmsEntry } from "@webiny/cms-sdk";
import type { CmsEntryValues } from "@webiny/cms-sdk";
import { useEntryStore } from "./useEntryStore.js";
import { useObservable } from "./useObservable.js";

/**
 * Returns the entry of the closest `EntryRenderer` (or `EntryStoreProvider`) as a ref.
 * In live preview, the ref updates every time the editor changes a field.
 */
export function useEntry<T extends CmsEntryValues = CmsEntryValues>(): Ref<CmsEntry<T> | null> {
    const store = useEntryStore();
    return useObservable(() => {
        const entry = store.getEntry();
        if (!entry) {
            return null;
        }
        // The store is not generic over the caller's values type.
        const plain = toJS(entry) as CmsEntry<T>;
        return plain;
    });
}
