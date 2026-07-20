import type { CmsEntryValues } from "./types.js";
import { EntryStore } from "./EntryStore.js";

class EntryStoreManager {
    private stores = new Map<string, EntryStore>();

    getStore<T extends CmsEntryValues = CmsEntryValues>(id: string): EntryStore<T> {
        if (!this.stores.has(id)) {
            this.stores.set(id, new EntryStore<T>());
        }
        return this.stores.get(id)! as EntryStore<T>;
    }

    removeStore(id: string) {
        this.stores.delete(id);
    }

    hasStore(id: string): boolean {
        return this.stores.has(id);
    }
}

export const entryStoreManager = new EntryStoreManager();
