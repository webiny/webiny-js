import { nextTick, ref } from "vue";
import { describe, it, expect, vi, afterEach } from "vitest";
import { contentSdk } from "@webiny/cms-sdk";
import type { ResolvedContentEntryQuery } from "@webiny/website-builder-sdk";
import { useContentEntryList } from "./useContentEntryList.js";

const query = { modelId: "article", limit: 2 };

const firstPage = (overrides: Partial<ResolvedContentEntryQuery<string>> = {}) => ({
    items: ["a", "b"],
    pageInfo: { cursor: "cursor-1", hasMore: true, totalCount: 4 },
    query,
    ...overrides
});

describe("useContentEntryList", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("seeds items from the server-resolved first page without fetching", () => {
        const listEntries = vi.spyOn(contentSdk, "listEntries");

        const list = useContentEntryList(firstPage());

        expect(list.items.value).toEqual(["a", "b"]);
        expect(list.hasMore.value).toBe(true);
        expect(list.loading.value).toBe(false);
        expect(listEntries).not.toHaveBeenCalled();
    });

    it("appends the next page on loadMore, using the embedded query and cursor", async () => {
        const listEntries = vi.spyOn(contentSdk, "listEntries").mockResolvedValue({
            data: ["c", "d"],
            meta: { cursor: null, hasMoreItems: false, totalCount: 4 }
        } as never);

        const list = useContentEntryList(firstPage());
        list.loadMore();
        expect(list.loading.value).toBe(true);

        await vi.waitFor(() => expect(list.loading.value).toBe(false));

        expect(listEntries).toHaveBeenCalledWith({ ...query, after: "cursor-1" });
        expect(list.items.value).toEqual(["a", "b", "c", "d"]);
        expect(list.hasMore.value).toBe(false);
    });

    it("never reports more pages when the value has no query (pagination disabled)", () => {
        const listEntries = vi.spyOn(contentSdk, "listEntries");

        const list = useContentEntryList(firstPage({ query: undefined }));
        list.loadMore();

        expect(list.hasMore.value).toBe(false);
        expect(listEntries).not.toHaveBeenCalled();
    });

    it("re-seeds when the resolved value changes", async () => {
        const value = ref<ResolvedContentEntryQuery<string> | null>(firstPage());

        const list = useContentEntryList(value);
        value.value = firstPage({
            items: ["x"],
            pageInfo: { cursor: "cursor-9", hasMore: false, totalCount: 1 },
            query: { ...query, limit: 1 }
        });
        await nextTick();

        expect(list.items.value).toEqual(["x"]);
        expect(list.hasMore.value).toBe(false);
    });

    it("handles a missing value", () => {
        const list = useContentEntryList(() => null);

        expect(list.items.value).toEqual([]);
        expect(list.hasMore.value).toBe(false);
    });
});
