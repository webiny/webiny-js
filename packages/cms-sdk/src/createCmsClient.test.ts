import { describe } from "vitest";
import { it } from "vitest";
import { expect } from "vitest";
import { vi } from "vitest";
import { createCmsClient } from "./createCmsClient.js";
import { contentSdk } from "./ContentSdk.js";

// Answers every getEntry with an entry named after the tenant that asked. Tenant A answers last.
const createFetch = (requests: string[]) => {
    return vi.fn(async (_url: RequestInfo | URL, init?: RequestInit) => {
        const headers = init?.headers as Record<string, string>;
        const tenant = headers["x-tenant"];
        requests.push(tenant);

        const delay = tenant === "tenant-a" ? 20 : 0;
        await new Promise(resolve => setTimeout(resolve, delay));

        const entry = { id: "e1#0001", entryId: "e1", values: { title: `Entry of ${tenant}` } };
        return {
            ok: true,
            json: async () => ({ data: { cms: { getEntry: { data: entry, error: null } } } })
        } as unknown as Response;
    });
};

describe("createCmsClient", () => {
    it("reads entries with each client's own tenant, concurrently", async () => {
        const requests: string[] = [];
        const fetch = createFetch(requests);

        const clientA = createCmsClient({
            apiHost: "https://a.example.com",
            apiKey: "key-a",
            apiTenant: "tenant-a",
            fetch
        });
        const clientB = createCmsClient({
            apiHost: "https://b.example.com",
            apiKey: "key-b",
            apiTenant: "tenant-b",
            fetch
        });

        const [entryA, entryB] = await Promise.all([
            clientA.getEntry({ modelId: "article", entryId: "e1" }),
            clientB.getEntry({ modelId: "article", entryId: "e1" })
        ]);

        expect(requests.sort()).toEqual(["tenant-a", "tenant-b"]);
        expect(entryA?.values.title).toBe("Entry of tenant-a");
        expect(entryB?.values.title).toBe("Entry of tenant-b");
    });

    it("leaves the contentSdk singleton uninitialized", () => {
        createCmsClient({ apiHost: "https://a.example.com", apiKey: "key-a" });

        expect(() => contentSdk.getEntry({ modelId: "article", entryId: "e1" })).toThrow(
            "CMS SDK is not initialized"
        );
    });
});
