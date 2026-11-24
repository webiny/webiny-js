import { defineComponent } from "vue";
import { provide } from "vue";
import { watch } from "vue";
import type { PropType } from "vue";
import { entryStoreManager } from "@webiny/cms-sdk";
import type { CmsEntry } from "@webiny/cms-sdk";
import type { EntryStoreConfig } from "@webiny/cms-sdk";
import { ENTRY_STORE_KEY } from "./injectionKeys.js";

/**
 * Provides the store of one entry. `setup` runs once, so `EntryStoreProvider` mounts a new
 * scope (keyed by `entryId`) whenever the entry changes, instead of reusing this one.
 */
export const EntryStoreScope = defineComponent({
    name: "WebinyEntryStoreScope",
    props: {
        entryId: { type: String, required: true },
        entry: { type: Object as PropType<CmsEntry>, default: undefined },
        storeConfig: { type: Object as PropType<EntryStoreConfig>, default: undefined }
    },
    setup(props, { slots }) {
        const store = entryStoreManager.getStore(props.entryId);

        watch(
            () => [props.storeConfig, props.entry] as const,
            ([storeConfig, entry]) => {
                if (storeConfig) {
                    store.configure(storeConfig);
                }
                if (entry) {
                    store.setEntry(entry);
                }
            },
            { immediate: true }
        );

        provide(ENTRY_STORE_KEY, store);

        return () => slots.default?.();
    }
});
