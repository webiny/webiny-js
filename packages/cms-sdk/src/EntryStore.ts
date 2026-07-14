import { makeAutoObservable, runInAction, observable } from "mobx";
import { jsonPatch, type JsonPatchOperation } from "./jsonPatch.js";
import type { CmsEntry, CmsEntryValues } from "./types.js";

export class EntryStore<T extends CmsEntryValues = CmsEntryValues> {
    private entry: CmsEntry<T> | null = null;
    private entryReady = false;
    private readyResolvers: (() => void)[] = [];

    constructor() {
        makeAutoObservable(this);
    }

    setEntry(entry: CmsEntry<T>) {
        runInAction(() => {
            if (this.entry) {
                Object.assign(this.entry, entry);
            } else {
                this.entry = observable(entry);
            }
            this.entryReady = true;
            this.readyResolvers.forEach(fn => fn());
            this.readyResolvers = [];
        });
    }

    getEntry(): CmsEntry<T> | null {
        return this.entry;
    }

    getValues(): T | null {
        return this.entry ? this.entry.values : null;
    }

    applyPatch(patch: JsonPatchOperation[]) {
        runInAction(() => {
            jsonPatch.applyPatch(this.entry!, patch, false, true);
        });
    }

    async waitForEntry(): Promise<CmsEntry<T>> {
        if (this.entryReady) {
            return this.entry as CmsEntry<T>;
        }

        return new Promise(resolve => {
            this.readyResolvers.push(() => {
                resolve(this.entry as CmsEntry<T>);
            });
        });
    }
}
