import { describe, it, expect, vi } from "vitest";
import { resolveContentEntryInput, type ContentEntryLoader } from "./resolveContentEntry.js";
import type { ContentEntryInput } from "~/types.js";

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

function makeInput(over: Partial<ContentEntryInput> = {}): ContentEntryInput {
    return { type: "contentEntry", name: "items", models: ["blog"], ...over } as ContentEntryInput;
}

describe("resolveContentEntryInput — manual mode", () => {
    it("resolves a single reference", async () => {
        const loader = makeLoader();
        const result = await resolveContentEntryInput(
            makeInput(),
            { id: "42", modelId: "blog" },
            loader
        );
        expect(loader.getEntry).toHaveBeenCalledWith({ modelId: "blog", entryId: "42" });
        expect(result).toEqual(entry("42"));
    });

    it("returns null for an empty single value", async () => {
        const loader = makeLoader();
        const result = await resolveContentEntryInput(makeInput(), null, loader);
        expect(result).toBeNull();
        expect(loader.getEntry).not.toHaveBeenCalled();
    });

    it("resolves a list of references, preserving order", async () => {
        const loader = makeLoader();
        const result = await resolveContentEntryInput(
            makeInput({ list: true }),
            [
                { id: "1", modelId: "blog" },
                { id: "2", modelId: "blog" }
            ],
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
        const result = await resolveContentEntryInput(
            makeInput({ list: true }),
            [
                { id: "1", modelId: "blog" },
                { id: "2", modelId: "blog" }
            ],
            loader
        );
        expect(result).toEqual([entry("1")]);
    });

    it("returns an empty array for an empty list", async () => {
        const loader = makeLoader();
        const result = await resolveContentEntryInput(makeInput({ list: true }), null, loader);
        expect(result).toEqual([]);
        expect(loader.getEntry).not.toHaveBeenCalled();
    });
});

describe("resolveContentEntryInput — query mode", () => {
    it("runs the editor's query and returns items + pageInfo", async () => {
        const loader = makeLoader();
        const result = await resolveContentEntryInput(
            makeInput({ mode: "query", query: { limit: { default: 3 } } }),
            { sort: { field: "values_title", order: "asc" }, limit: 5, search: "cat" },
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

    it("does not embed the continuation query when pagination is off", async () => {
        const loader = makeLoader();
        const result = (await resolveContentEntryInput(
            makeInput({ mode: "query" }),
            {},
            loader
        )) as Record<string, unknown>;
        expect(result.query).toBeUndefined();
    });

    it("embeds the continuation query when pagination is on", async () => {
        const loader = makeLoader();
        const result = (await resolveContentEntryInput(
            makeInput({ mode: "query", query: { pagination: true } }),
            { limit: 4 },
            loader
        )) as Record<string, unknown>;
        expect(result.query).toEqual({
            modelId: "blog",
            sort: undefined,
            limit: 4,
            search: undefined
        });
    });

    it("falls back to the configured default limit", async () => {
        const loader = makeLoader();
        await resolveContentEntryInput(
            makeInput({ mode: "query", query: { limit: { default: 12 } } }),
            {},
            loader
        );
        expect(loader.listEntries).toHaveBeenCalledWith(expect.objectContaining({ limit: 12 }));
    });

    it("sorts by a single declared field ascending by default", async () => {
        const loader = makeLoader();
        await resolveContentEntryInput(
            makeInput({ mode: "query", query: { sort: { fields: ["values_title"] } } }),
            {},
            loader
        );
        expect(loader.listEntries).toHaveBeenCalledWith(
            expect.objectContaining({ sort: { values_title: "asc" } })
        );
    });

    it("does not default sorting when several fields are configured", async () => {
        const loader = makeLoader();
        await resolveContentEntryInput(
            makeInput({ mode: "query", query: { sort: { fields: ["a", "b"] } } }),
            {},
            loader
        );
        expect(loader.listEntries).toHaveBeenCalledWith(
            expect.objectContaining({ sort: undefined })
        );
    });

    it("returns an empty result when the input has no model", async () => {
        const loader = makeLoader();
        const result = await resolveContentEntryInput(
            makeInput({ mode: "query", models: [] }),
            {},
            loader
        );
        expect(loader.listEntries).not.toHaveBeenCalled();
        expect(result).toEqual({
            items: [],
            pageInfo: { cursor: null, hasMore: false, totalCount: 0 }
        });
    });
});
