import { describe, expect, it, vi } from "vitest";
import { DefaultDataProvider } from "./DefaultDataProvider.js";
import { GET_LAYOUT_BY_SLUG } from "./GET_LAYOUT_BY_SLUG.js";
import type { ApiClient } from "./ApiClient.js";

const createProvider = (envelope: Record<string, any>) => {
    const query = vi.fn().mockResolvedValue({ websiteBuilder: { getLayoutBySlug: envelope } });
    const provider = new DefaultDataProvider({ apiClient: { query } as unknown as ApiClient });
    return { provider, query };
};

describe("DefaultDataProvider.getLayoutBySlug", () => {
    it("asks for the layout by slug and language, and returns it composed", async () => {
        const layout = {
            elements: { "$global:Demo/Header": { id: "$global:Demo/Header" } },
            bindings: {},
            layout: { id: "abc#0001", entryId: "abc", properties: {}, elements: {}, bindings: {} }
        };
        const { provider, query } = createProvider({ data: layout, error: null });

        expect(await provider.getLayoutBySlug({ slug: "blog", language: "de" })).toEqual(layout);
        expect(query).toHaveBeenCalledWith({
            query: GET_LAYOUT_BY_SLUG,
            variables: { slug: "blog", language: "de" }
        });
    });

    it("returns null when no layout is published, or the API fails", async () => {
        const { provider, query } = createProvider({ data: null, error: null });
        expect(await provider.getLayoutBySlug({ slug: "blog" })).toBeNull();
        expect(query.mock.calls[0][0].variables).toEqual({ slug: "blog", language: null });

        const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
        const failing = createProvider({
            data: null,
            error: { code: "WebsiteBuilder/Layout/NotAuthorized", message: "Not authorized!" }
        });
        expect(await failing.provider.getLayoutBySlug({ slug: "blog" })).toBeNull();
        expect(consoleError).toHaveBeenCalled();
        consoleError.mockRestore();
    });
});
