import { observable, runInAction } from "mobx";
import { GetContentEntriesGateway } from "../getContentEntries/abstractions.js";
import type { CmsReferenceEntry, CmsReferenceValue } from "../refTypes.js";
import { ReferenceTitles as Abstraction } from "./abstractions.js";

// A reference points at a revision (`entryId#0001`), but the title shown is the latest one, so
// every revision of an entry shares a key.
function toKey(modelId: string, id: string): string {
    return `${modelId}:${id.split("#")[0]}`;
}

class ReferenceTitlesImpl implements Abstraction.Interface {
    private readonly titles = observable.map<string, string>();
    private readonly requested = new Set<string>();
    private queue: CmsReferenceValue[] = [];

    constructor(private gateway: GetContentEntriesGateway.Interface) {}

    getTitle(ref: CmsReferenceValue): string | undefined {
        const key = toKey(ref.modelId, ref.id);
        if (!this.titles.has(key) && !this.requested.has(key)) {
            this.requested.add(key);
            this.enqueue(ref);
        }
        return this.titles.get(key);
    }

    remember(entries: CmsReferenceEntry[]): void {
        runInAction(() => {
            for (const entry of entries) {
                this.titles.set(toKey(entry.model.modelId, entry.entryId), entry.title);
            }
        });
    }

    private enqueue(ref: CmsReferenceValue): void {
        this.queue.push(ref);
        if (this.queue.length > 1) {
            return;
        }
        // Wait for the render pass to finish asking, then load everything it asked for at once.
        setTimeout(() => this.flush(), 0);
    }

    private async flush(): Promise<void> {
        const entries = this.queue;
        this.queue = [];
        const keys = entries.map(ref => toKey(ref.modelId, ref.id));
        try {
            const result = await this.gateway.execute({ entries });
            this.remember(result.latest);
            // A deleted entry has no title. Settle it as empty, so a title made of several
            // references doesn't wait on it forever.
            runInAction(() => {
                for (const key of keys) {
                    if (!this.titles.has(key)) {
                        this.titles.set(key, "");
                    }
                }
            });
        } catch (e) {
            // The title falls back to the item's default label until the next render asks again.
            for (const key of keys) {
                this.requested.delete(key);
            }
            console.error(e);
        }
    }
}

export const ReferenceTitles = Abstraction.createImplementation({
    implementation: ReferenceTitlesImpl,
    dependencies: [GetContentEntriesGateway]
});
