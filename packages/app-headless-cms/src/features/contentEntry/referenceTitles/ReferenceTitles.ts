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
        try {
            const result = await this.gateway.execute({ entries });
            this.remember(result.latest);
        } catch (e) {
            // The title falls back to the item's default label; the reference input reports the error.
            console.error(e);
        }
    }
}

export const ReferenceTitles = Abstraction.createImplementation({
    implementation: ReferenceTitlesImpl,
    dependencies: [GetContentEntriesGateway]
});
