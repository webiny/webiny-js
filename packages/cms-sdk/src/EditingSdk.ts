"use client";

import type {
    CmsEntryValues,
    CmsEntry,
    CmsListResult,
    GetEntryParams,
    ListEntriesParams,
    IContentSdk
} from "./types.js";
import { Messenger, MessageOrigin } from "./messenger/index.js";
import { componentRegistry } from "./component/ComponentRegistry.js";

export class EditingSdk implements IContentSdk {
    public readonly messenger: Messenger;
    private entry: Record<string, unknown> | null = null;
    private entryListeners = new Set<(entry: Record<string, unknown>) => void>();

    constructor() {
        const source = new MessageOrigin(() => window, window.location.origin);
        const target = new MessageOrigin(() => window.parent, this.getReferrerOrigin());

        this.messenger = new Messenger(source, target, "cms.preview.*");

        componentRegistry.onRegister(component => {
            this.messenger.send("preview.component.register", component.manifest);
        });

        this.messenger.on("entry.update", (data: Record<string, unknown>) => {
            this.entry = data;
            this.entryListeners.forEach(fn => fn(data));
        });

        this.messenger.send("preview.ready", true);
    }

    async getEntry<T extends CmsEntryValues = CmsEntryValues>(
        _params: GetEntryParams
    ): Promise<CmsEntry<T> | null> {
        if (!this.entry) {
            return null;
        }
        return this.entry as unknown as CmsEntry<T>;
    }

    async listEntries<T extends CmsEntryValues = CmsEntryValues>(
        _params: ListEntriesParams
    ): Promise<CmsListResult<T>> {
        return { data: [], meta: { cursor: null, hasMoreItems: false, totalCount: 0 } };
    }

    onEntryUpdate(fn: (entry: Record<string, unknown>) => void): () => void {
        this.entryListeners.add(fn);
        return () => this.entryListeners.delete(fn);
    }

    private getReferrerOrigin(): string {
        try {
            const params = new URLSearchParams(window.location.search);
            return params.get("origin") || "";
        } catch {
            return "";
        }
    }
}
