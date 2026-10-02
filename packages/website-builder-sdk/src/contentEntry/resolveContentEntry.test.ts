import { describe, it, expect, vi } from "vitest";
import {
    resolveContentEntryValue,
    isQueryValue,
    isAlreadyResolved,
    type ContentEntryLoader
} from "./resolveContentEntry.js";

const entry = (id: string) => ({ id, entryId: id, values: { title: `T${id}` } });

function makeLoader(over: Partial<ContentEntryLoader> = {}): ContentEntryLoader {
    return {
        getEntry: vi.fn(async ({ entryId }: { entryId: string }) => entry(entryId)),
        listEntries: vi.fn(async () => ({
            data: [entry("1"), entry("2")],
            meta: { cursor: "c1", hasMoreItems: true, totalCount: 5 }
        })),
        ...over
    };
}

describe("resolveContentEntryValue — manual mode", () => {
    it("resolves a single reference", async () => {
        const loader = makeLoader();
        const result = await resolveContentEntryValue({ id: "42", modelId: "blog" }, false, loader);
        expect(loader.getEntry).toHaveBeenCalledWith({ modelId: "blog", entryId: "42" });
        expect(result).toEqual(entry("42"));
    });

    it("returns null for a null single value", async () => {
        const loader = makeLoader();
        const result = await resolveContentEntryValue(null, false, loader);
        expect(result).toBeNull();
        expect(loader.getEntry).not.toHaveBeenCalled();
    });

    it("resolves a list of references, preserving order", async () => {
        const loader = makeLoader();
        const result = await resolveContentEntryValue(
            [
                { id: "1", modelId: "blog" },
                { id: "2", modelId: "blog" }
            ],
            true,
            loader
        );
        expect(loader.getEntry).toHaveBeenCalledTimes(2);
        expect(result).toEqual([entry("1"), entry("2")]);
    });

    it("filters out unresolved (deleted) references in a list", async () => {
        const loader = makeLoader({
            getEntry: vi.fn(async ({ entryId }: { entryId: string }) =>
                entryId === "2" ? null : entry(entryId)
            )
        });
        const result = await resolveContentEntryValue(
            [
                { id: "1", modelId: "blog" },
                { id: "2", modelId: "blog" }
            ],
            true,
            loader
        );
        expect(result).toEqual([entry("1")]);
    });

    it("returns an empty array for a null list value", async () => {
        const loader = makeLoader();
        const result = await resolveContentEntryValue(null, true, loader);
        expect(result).toEqual([]);
        expect(loader.getEntry).not.toHaveBeenCalled();
    });
});

describe("resolveContentEntryValue — query mode", () => {
    it("runs the query and returns items + pageInfo", async () => {
        const loader = makeLoader();
        const result = await resolveContentEntryValue(
            {
                modelId: "blog",
                sort: { field: "values_title", order: "asc" },
                limit: 5,
                search: "cat"
            },
            false,
            loader
        );
        expect(loader.listEntries).toHaveBeenCalledWith({
            modelId: "blog",
            sort: { values_title: "asc" },
            limit: 5,
            search: "cat"
        });
        expect(result).toMatchObject({
            items: [entry("1"), entry("2")],
            pageInfo: { cursor: "c1", hasMore: true, totalCount: 5 }
        });
    });

    it("always embeds the continuation query", async () => {
        const loader = makeLoader();
        const result = (await resolveContentEntryValue(
            { modelId: "blog", limit: 4 },
            false,
            loader
        )) as Record<string, unknown>;
        expect(result.query).toEqual({
            modelId: "blog",
            sort: undefined,
            limit: 4,
            search: undefined
        });
    });

    it("runs a minimal query (modelId only)", async () => {
        const loader = makeLoader();
        await resolveContentEntryValue({ modelId: "blog" }, false, loader);
        expect(loader.listEntries).toHaveBeenCalledWith({
            modelId: "blog",
            sort: undefined,
            limit: undefined,
            search: undefined
        });
    });
});

describe("isQueryValue", () => {
    it("returns true for { modelId } without id", () => {
        expect(isQueryValue({ modelId: "blog" })).toBe(true);
        expect(isQueryValue({ modelId: "blog", sort: { field: "a", order: "asc" } })).toBe(true);
    });

    it("returns false for a manual reference { id, modelId }", () => {
        expect(isQueryValue({ id: "42", modelId: "blog" })).toBe(false);
    });

    it("returns false for arrays and non-objects", () => {
        expect(isQueryValue([{ modelId: "blog" }])).toBe(false);
        expect(isQueryValue(null)).toBe(false);
        expect(isQueryValue("string")).toBe(false);
    });
});

describe("isAlreadyResolved", () => {
    it("returns true for a query result with items", () => {
        expect(isAlreadyResolved({ items: [], pageInfo: {} }, false)).toBe(true);
    });

    it("returns true for a list of resolved entries", () => {
        expect(isAlreadyResolved([{ values: { title: "x" } }], true)).toBe(true);
    });

    it("returns false for a list of bare references", () => {
        expect(isAlreadyResolved([{ id: "1", modelId: "blog" }], true)).toBe(false);
    });

    it("returns true for a single resolved entry", () => {
        expect(isAlreadyResolved({ values: { title: "x" } }, false)).toBe(true);
    });

    it("returns false for null", () => {
        expect(isAlreadyResolved(null, false)).toBe(false);
        expect(isAlreadyResolved(null, true)).toBe(false);
    });
});
