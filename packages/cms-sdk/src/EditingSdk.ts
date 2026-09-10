"use client";

import type {
    CmsEntryValues,
    CmsEntry,
    CmsListResult,
    CmsModelDefinition,
    GetEntryParams,
    ListEntriesParams,
    IContentSdk
} from "./types.js";
import { Messenger, MessageOrigin } from "./messenger/index.js";
import { componentRegistry } from "./component/ComponentRegistry.js";
import { entryStoreManager } from "./EntryStoreManager.js";
import type { EntryStore } from "./EntryStore.js";
import type { JsonPatchOperation } from "./jsonPatch.js";

export class EditingSdk implements IContentSdk {
    public readonly messenger: Messenger;
    public readonly entryStore: EntryStore;
    private liveSdk: IContentSdk;

    constructor(liveSdk: IContentSdk) {
        this.liveSdk = liveSdk;

        const entryId = this.getEntryId();
        this.entryStore = entryStoreManager.getStore(entryId);

        const source = new MessageOrigin(() => window, window.location.origin);
        const target = new MessageOrigin(() => window.parent, this.getReferrerOrigin());

        this.messenger = new Messenger(source, target, "wb.editor.*");

        componentRegistry.onRegister(component => {
            this.messenger.send("preview.component.register", component.manifest);
        });

        this.messenger.on("document.set", (data: Record<string, unknown>) => {
            this.entryStore.setEntry(data as unknown as CmsEntry);
        });

        this.messenger.on("document.patch", (patch: unknown[]) => {
            this.entryStore.applyPatch(patch as JsonPatchOperation[]);
        });

        this.messenger.send("preview.ready", true);
    }

    async getModel(modelId: string): Promise<CmsModelDefinition | null> {
        return this.liveSdk.getModel(modelId);
    }

    async getEntry<T extends CmsEntryValues = CmsEntryValues>(
        params: GetEntryParams
    ): Promise<CmsEntry<T> | null> {
        const editingEntryId = this.getEntryId();
        if (params.entryId === editingEntryId) {
            return this.entryStore.waitForEntry() as Promise<CmsEntry<T>>;
        }
        return this.liveSdk.getEntry<T>(params);
    }

    async listEntries<T extends CmsEntryValues = CmsEntryValues>(
        params: ListEntriesParams
    ): Promise<CmsListResult<T>> {
        return this.liveSdk.listEntries<T>(params);
    }

    private getEntryId(): string {
        try {
            const params = new URLSearchParams(window.location.search);
            return params.get("wb.id") || "";
        } catch {
            return "";
        }
    }

    private getReferrerOrigin(): string {
        try {
            const params = new URLSearchParams(window.location.search);
            return params.get("wb.referrer") || "";
        } catch {
            return "";
        }
    }
}
