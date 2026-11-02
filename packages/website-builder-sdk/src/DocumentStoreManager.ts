import type { Document } from "./types.js";
import { DocumentStore } from "./DocumentStore.js";

// High enough that an app serving one site never reaches it.
export const DEFAULT_MAX_DOCUMENT_STORES = 10_000;

export type DocumentStoreManagerOptions = {
    // Stores kept before the least recently used one is dropped.
    maxEntries?: number;
};

export class DocumentStoreManager {
    private stores = new Map<string, DocumentStore>();
    private readonly maxEntries: number;

    constructor(options: DocumentStoreManagerOptions = {}) {
        this.maxEntries = options.maxEntries ?? DEFAULT_MAX_DOCUMENT_STORES;
    }

    getStores() {
        return this.stores;
    }

    getStore<TDocument extends Document>(id: string): DocumentStore<TDocument> {
        const existing = this.stores.get(id);
        if (existing) {
            // Move it to the end, so the map stays ordered from least to most recently used.
            this.stores.delete(id);
            this.stores.set(id, existing);
            return existing as DocumentStore<TDocument>;
        }

        const store = new DocumentStore<TDocument>();
        this.stores.set(id, store);
        this.evict();
        return store;
    }

    removeStore(id: string) {
        this.stores.delete(id);
    }

    hasStore(id: string): boolean {
        return this.stores.has(id);
    }

    clear() {
        this.stores.clear();
    }

    private evict() {
        while (this.stores.size > this.maxEntries) {
            const oldest = this.stores.keys().next().value!;
            this.stores.delete(oldest);
        }
    }
}

export const documentStoreManager = new DocumentStoreManager();
