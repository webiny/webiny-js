import { LayoutPreviewPageStorage as StorageAbstraction } from "./abstractions.js";

const key = (layoutEntryId: string) => `webiny.websiteBuilder.layoutPreviewPage.${layoutEntryId}`;

class LocalStorageLayoutPreviewPageStorage implements StorageAbstraction.Interface {
    get(layoutEntryId: string) {
        try {
            return window.localStorage.getItem(key(layoutEntryId)) || null;
        } catch {
            return null;
        }
    }

    set(layoutEntryId: string, pageId: string | null) {
        try {
            if (pageId) {
                window.localStorage.setItem(key(layoutEntryId), pageId);
            } else {
                window.localStorage.removeItem(key(layoutEntryId));
            }
        } catch {
            // Storage is not available: the choice is not remembered.
        }
    }
}

export const LayoutPreviewPageStorage = StorageAbstraction.createImplementation({
    implementation: LocalStorageLayoutPreviewPageStorage,
    dependencies: []
});
