import { makeAutoObservable, runInAction, observable, set as mobxSet, toJS } from "mobx";
import { jsonPatch, type JsonPatchOperation } from "./jsonPatch.js";
import { collectRefs, setAtPath } from "./refUtils.js";
import type { CmsEntry, CmsEntryValues, CmsRefModelMetadata, GetEntryParams } from "./types.js";
import { refCache } from "./RefCache.js";

export interface EntryStoreRefResolver {
    getEntry(params: GetEntryParams): Promise<CmsEntry | null>;
}

export interface EntryStoreConfig {
    refModels?: Record<string, CmsRefModelMetadata>;
    refResolver?: EntryStoreRefResolver;
}

export class EntryStore<T extends CmsEntryValues = CmsEntryValues> {
    private entry: CmsEntry<T> | null = null;
    private entryReady = false;
    private readyResolvers: (() => void)[] = [];
    private config: EntryStoreConfig = {};

    constructor() {
        makeAutoObservable(this);
    }

    configure(config: EntryStoreConfig) {
        console.log("[EntryStore] configure", {
            hasRefModels: !!config.refModels,
            refModelIds: config.refModels ? Object.keys(config.refModels) : [],
            hasRefResolver: !!config.refResolver
        });
        this.config = config;
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

        this.resolveRefsLazy();
    }

    getEntry(): CmsEntry<T> | null {
        return this.entry;
    }

    getValues(): T | null {
        return this.entry ? this.entry.values : null;
    }

    applyPatch(patch: JsonPatchOperation[]) {
        console.log("[EntryStore] applyPatch, patch:", JSON.stringify(patch));

        runInAction(() => {
            jsonPatch.applyPatch(this.entry!, patch, false, true);
        });

        const valuesAfter = toJS(this.entry!.values);
        const content = (valuesAfter as Record<string, unknown>).content;
        if (Array.isArray(content)) {
            for (const item of content) {
                const rec = item as Record<string, unknown>;
                if (rec.author) {
                    console.log("[EntryStore] author after patch:", rec.author);
                }
            }
        }

        this.resolveRefsLazy(true);
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

    private async resolveRefsLazy(useToJS = false) {
        const { refModels, refResolver } = this.config;
        console.log("[EntryStore] resolveRefsLazy", {
            hasRefModels: !!refModels,
            hasRefResolver: !!refResolver,
            hasEntry: !!this.entry
        });
        if (!refModels || !refResolver || !this.entry) {
            return;
        }

        const valuesToScan = useToJS ? toJS(this.entry.values) : this.entry.values;
        const refs = collectRefs(valuesToScan, refModels);
        console.log(
            "[EntryStore] found refs:",
            refs.length,
            refs.map(r => ({ id: r.id, modelId: r.modelId }))
        );
        if (refs.length === 0) {
            return;
        }

        const uniqueRefs = new Map<string, { id: string; modelId: string }>();
        for (const ref of refs) {
            uniqueRefs.set(ref.id, ref);
        }

        const fetchPromises = Array.from(uniqueRefs.values()).map(async ref => {
            const resolved = await refResolver.getEntry({
                modelId: ref.modelId,
                entryId: ref.id
            });
            return { id: ref.id, resolved };
        });

        const results = await Promise.all(fetchPromises);
        const resolvedMap = new Map<string, CmsEntry | null>();
        for (const { id, resolved } of results) {
            resolvedMap.set(id, resolved);
            refCache.set(id, resolved);
        }

        console.log(
            "[EntryStore] resolved refs:",
            Array.from(resolvedMap.entries()).map(([id, e]) => ({ id, found: !!e }))
        );

        runInAction(() => {
            if (!this.entry) {
                return;
            }
            const values = toJS(this.entry.values);
            for (const ref of refs) {
                const resolved = resolvedMap.get(ref.id);
                if (resolved) {
                    setAtPath(values, ref.path, { ...resolved, modelId: ref.modelId });
                }
            }
            mobxSet(this.entry, "values", observable(values));
        });
    }
}
