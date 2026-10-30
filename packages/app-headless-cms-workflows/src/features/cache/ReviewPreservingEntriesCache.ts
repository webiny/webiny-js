import type { IListCache } from "@webiny/app-admin/features/listCache/index.js";
import type { IListCacheItemUpdater } from "@webiny/app-admin/features/listCache/index.js";
import type { IListCachePredicate } from "@webiny/app-admin/features/listCache/index.js";
import type { CmsContentEntry } from "@webiny/app-headless-cms-common/types/index.js";
import type { ICmsEntryMetaWithReview } from "~/types.js";

/*
 * Only the entry list and entry reads select `meta.system.workflow`; the entries the mutations
 * return (update, publish, restore, ...) do not, and adding one replaces the cached row. An added
 * entry without a workflow selection keeps the cached revision's workflow; a different revision
 * of the entry (a new one) has no review of its own yet, so it keeps nothing.
 */
export class ReviewPreservingEntriesCache implements IListCache<CmsContentEntry> {
    constructor(private readonly cache: IListCache<CmsContentEntry>) {}

    count(): number {
        return this.cache.count();
    }

    clear(): void {
        this.cache.clear();
    }

    hasItems(): boolean {
        return this.cache.hasItems();
    }

    getItems(): CmsContentEntry[] {
        return this.cache.getItems();
    }

    getItem(predicate: IListCachePredicate<CmsContentEntry>): CmsContentEntry | undefined {
        return this.cache.getItem(predicate);
    }

    addItems(items: CmsContentEntry[]): void {
        this.cache.addItems(items.map(item => this.keepCachedWorkflow(item)));
    }

    setItems(items: CmsContentEntry[]): void {
        this.cache.setItems(items);
    }

    updateItems(updater: IListCacheItemUpdater<CmsContentEntry>): void {
        this.cache.updateItems(updater);
    }

    removeItems(predicate: IListCachePredicate<CmsContentEntry>): void {
        this.cache.removeItems(predicate);
    }

    private keepCachedWorkflow(item: CmsContentEntry): CmsContentEntry {
        const meta: ICmsEntryMetaWithReview = item.meta;

        if (meta.system?.workflow !== undefined) {
            return item;
        }

        const cached = this.cache.getItem(entry => entry.id === item.id);
        const cachedMeta: ICmsEntryMetaWithReview | undefined = cached?.meta;
        const workflow = cachedMeta?.system?.workflow;

        if (workflow === undefined) {
            return item;
        }

        const nextMeta: ICmsEntryMetaWithReview = {
            ...item.meta,
            system: { ...meta.system, workflow }
        };

        return { ...item, meta: nextMeta };
    }
}
