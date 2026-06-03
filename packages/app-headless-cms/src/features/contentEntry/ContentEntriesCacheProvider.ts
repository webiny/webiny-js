import { ListCache, type IListCache } from "@webiny/app-admin/features/listCache/index.js";
import type { CmsContentEntry } from "~/types.js";
import {
    ContentEntriesCacheProvider as Abstraction,
    type IContentEntriesCacheProvider
} from "./abstractions.js";

class ContentEntriesCacheProviderImpl implements IContentEntriesCacheProvider {
    private caches = new Map<string, IListCache<CmsContentEntry>>();

    get(modelId: string): IListCache<CmsContentEntry> {
        let cache = this.caches.get(modelId);
        if (!cache) {
            cache = new ListCache<CmsContentEntry>("entryId");
            this.caches.set(modelId, cache);
        }
        return cache;
    }
}

export const ContentEntriesCacheProviderImplementation = Abstraction.createImplementation({
    implementation: ContentEntriesCacheProviderImpl,
    dependencies: []
});
