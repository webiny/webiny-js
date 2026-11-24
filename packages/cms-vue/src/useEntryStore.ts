import { inject } from "vue";
import type { EntryStore } from "@webiny/cms-sdk";
import { ENTRY_STORE_KEY } from "./injectionKeys.js";

export const useEntryStore = (): EntryStore => {
    const store = inject(ENTRY_STORE_KEY, undefined);
    if (!store) {
        throw new Error("useEntryStore must be used within an EntryStoreProvider");
    }
    return store;
};
