import type { Document } from "./types.js";
import { DocumentStore } from "./DocumentStore.js";

export class DocumentStoreManager {
    private stores = new Map<string, DocumentStore>();

    getStores() {
        return this.stores;
    }

    getStore<TDocument extends Document>(id: string): DocumentStore<TDocument> {
        if (!this.stores.has(id)) {
            this.stores.set(id, new DocumentStore<TDocument>());
        }
        return this.stores.get(id)! as DocumentStore<TDocument>;
    }

    removeStore(id: string) {
        this.stores.delete(id);
    }

    hasStore(id: string): boolean {
        return this.stores.has(id);
    }
}

export const documentStoreManager = new DocumentStoreManager();
