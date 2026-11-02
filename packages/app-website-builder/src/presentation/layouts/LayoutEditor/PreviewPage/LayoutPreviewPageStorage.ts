import { LocalStorage } from "@webiny/app/features/localStorage";
import { LayoutPreviewPageStorage as StorageAbstraction } from "./abstractions.js";

const key = (layoutEntryId: string) => `websiteBuilder.layoutPreviewPage.${layoutEntryId}`;

class LocalStorageLayoutPreviewPageStorage implements StorageAbstraction.Interface {
    constructor(private readonly localStorage: LocalStorage.Interface) {}

    get(layoutEntryId: string) {
        return this.localStorage.get<string>(key(layoutEntryId)) || null;
    }

    set(layoutEntryId: string, pageId: string | null) {
        if (pageId) {
            this.localStorage.set(key(layoutEntryId), pageId);
        } else {
            this.localStorage.remove(key(layoutEntryId));
        }
    }
}

export const LayoutPreviewPageStorage = StorageAbstraction.createImplementation({
    implementation: LocalStorageLayoutPreviewPageStorage,
    dependencies: [LocalStorage]
});
