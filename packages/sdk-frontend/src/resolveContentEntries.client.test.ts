import { describe, it, expect, vi } from "vitest";
import { createCmsClient } from "@webiny/cms-sdk";
import { contentEntryCache, createContentClient } from "@webiny/website-builder-sdk";
import type { Document } from "@webiny/website-builder-sdk";
import { resolveContentEntries } from "./resolveContentEntries.js";
import { createCmsContentEntryLoader } from "./createCmsContentEntryLoader.js";

// Answers every getEntry with an entry named after the tenant that asked. Tenant A answers last.
const fetch = vi.fn(async (_url: RequestInfo | URL, init?: RequestInit) => {
    const headers = init?.headers as Record<string, string>;
    const tenant = headers["x-tenant"];

    const delay = tenant === "tenant-a" ? 20 : 0;
    await new Promise(resolve => setTimeout(resolve, delay));

    const entry = { id: "42#0001", entryId: "42", values: { title: `Article of ${tenant}` } };
    return {
        ok: true,
        json: async () => ({ data: { cms: { getEntry: { data: entry, error: null } } } })
    } as unknown as Response;
});

// The same page, seeded from one template into two tenants: same element id, same reference.
const createDocument = (): Document => {
    return {
        id: "doc1",
        version: 1,
        state: {},
        properties: {},
        extensions: {},
        metadata: {} as Document["metadata"],
        elements: {
            hero: { id: "hero", type: "Webiny/Element", component: { name: "Hero" } }
        },
        bindings: {
            hero: {
                inputs: {
                    article: {
                        id: "article",
                        type: "contentEntry",
                        static: { id: "42", modelId: "blog" }
                    }
                }
            }
        }
    };
};

const createTenantClient = (tenant: string) => {
    const config = {
        apiHost: `https://${tenant}.example.com`,
        apiKey: `key-${tenant}`,
        apiTenant: tenant
    };
    const cmsClient = createCmsClient({ ...config, fetch });

    return createContentClient({
        ...config,
        contentEntryLoader: createCmsContentEntryLoader(cmsClient)
    });
};

const titleOf = (value: unknown) => {
    const entry = value as { values: { title: string } };
    return entry.values.title;
};

describe("resolveContentEntries with a content client", () => {
    it("resolves the same element id to each client's own tenant entry, concurrently", async () => {
        const clientA = createTenantClient("tenant-a");
        const clientB = createTenantClient("tenant-b");
        const documentA = createDocument();
        const documentB = createDocument();

        await Promise.all([
            resolveContentEntries(documentA, { client: clientA }),
            resolveContentEntries(documentB, { client: clientB })
        ]);

        const cachedA = clientA.getContentEntryCache().get("hero:article");
        const cachedB = clientB.getContentEntryCache().get("hero:article");
        expect(titleOf(cachedA)).toBe("Article of tenant-a");
        expect(titleOf(cachedB)).toBe("Article of tenant-b");
        const embeddedA = documentA.__cache?.contentEntries as Record<string, unknown>;
        const embeddedB = documentB.__cache?.contentEntries as Record<string, unknown>;
        expect(titleOf(embeddedA["hero:article"])).toBe("Article of tenant-a");
        expect(titleOf(embeddedB["hero:article"])).toBe("Article of tenant-b");

        // The singleton cache isn't touched.
        expect(contentEntryCache.has("hero:article")).toBe(false);
    });

    it("refuses a client without a content entry loader instead of using the CMS singleton", async () => {
        const client = createContentClient({
            apiHost: "https://a.example.com",
            apiKey: "key-a",
            apiTenant: "tenant-a"
        });

        await expect(resolveContentEntries(createDocument(), { client })).rejects.toThrow(
            "no contentEntryLoader"
        );
    });
});
