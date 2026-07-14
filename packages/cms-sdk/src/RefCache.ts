import { makeAutoObservable, runInAction, observable } from "mobx";
import type { CmsEntry, GetEntryParams } from "./types.js";

export interface RefCacheResolver {
    getEntry(params: GetEntryParams): Promise<CmsEntry | null>;
}

class RefCacheImpl {
    private cache = new Map<string, CmsEntry | null>();
    private pending = new Map<string, Promise<CmsEntry | null>>();
    private resolver: RefCacheResolver | null = null;

    constructor() {
        makeAutoObservable(this);
    }

    setResolver(resolver: RefCacheResolver) {
        this.resolver = resolver;
    }

    get(id: string): CmsEntry | null | undefined {
        return this.cache.get(id);
    }

    has(id: string): boolean {
        return this.cache.has(id);
    }

    set(id: string, entry: CmsEntry | null) {
        runInAction(() => {
            this.cache.set(id, entry);
        });
    }

    async resolve(id: string, modelId: string): Promise<CmsEntry | null> {
        if (this.cache.has(id)) {
            return this.cache.get(id) || null;
        }

        if (this.pending.has(id)) {
            return this.pending.get(id)!;
        }

        if (!this.resolver) {
            return null;
        }

        const promise = this.resolver.getEntry({ modelId, entryId: id }).then(entry => {
            runInAction(() => {
                this.cache.set(id, entry);
                this.pending.delete(id);
            });
            return entry;
        });

        this.pending.set(id, promise);
        return promise;
    }

    invalidate(id: string) {
        runInAction(() => {
            this.cache.delete(id);
        });
    }

    clear() {
        runInAction(() => {
            this.cache.clear();
        });
    }
}

export const refCache = new RefCacheImpl();
