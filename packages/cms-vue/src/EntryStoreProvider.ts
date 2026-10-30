import { defineComponent, inject, provide, watch, type InjectionKey, type PropType } from "vue";
import {
    entryStoreManager,
    type CmsEntry,
    type EntryStore,
    type EntryStoreConfig
} from "@webiny/cms-sdk";

export const ENTRY_STORE_KEY: InjectionKey<EntryStore> = Symbol("WebinyEntryStore");

export const EntryStoreProvider = defineComponent({
    name: "WebinyEntryStoreProvider",
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

export const useEntryStore = (): EntryStore => {
    const store = inject(ENTRY_STORE_KEY, undefined);
    if (!store) {
        throw new Error("useEntryStore must be used within an EntryStoreProvider");
    }
    return store;
};
