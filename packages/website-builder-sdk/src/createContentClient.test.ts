import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createContentClient } from "./createContentClient.js";
import { contentSdk } from "./ContentSdk.js";

interface RecordedRequest {
    url: string;
    tenant: string;
    authorization: string;
    path: string;
}

const pageResponse = (path: string) => {
    return {
        data: {
            websiteBuilder: {
                getPageByPath: {
                    data: { id: `page:${path}`, properties: { id: `page:${path}`, path } },
                    error: null
                }
            }
        }
    };
};

describe("createContentClient", () => {
    let requests: RecordedRequest[];
    let delays: Record<string, number>;

    beforeEach(() => {
        requests = [];
        delays = {};

        const fetchMock = vi.fn(async (url: string, init: RequestInit) => {
            const headers = init.headers as Record<string, string>;
            const body = JSON.parse(init.body as string);
            const path: string = body.variables.path;
            requests.push({
                url,
                tenant: headers["X-Tenant"],
                authorization: headers["Authorization"],
                path
            });

            const delay = delays[path] ?? 0;
            await new Promise(resolve => setTimeout(resolve, delay));

            return { json: async () => pageResponse(path) };
        });

        vi.stubGlobal("fetch", fetchMock);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("sends each client's own tenant, host and key", async () => {
        const clientA = createContentClient({
            apiHost: "https://a.example.com",
            apiKey: "key-a",
            apiTenant: "tenant-a"
        });
        const clientB = createContentClient({
            apiHost: "https://b.example.com",
            apiKey: "key-b",
            apiTenant: "tenant-b"
        });

        await clientA.getPage("/a");
        await clientB.getPage("/b");

        expect(requests).toEqual([
            {
                url: "https://a.example.com/graphql",
                tenant: "tenant-a",
                authorization: "Bearer key-a",
                path: "/a"
            },
            {
                url: "https://b.example.com/graphql",
                tenant: "tenant-b",
                authorization: "Bearer key-b",
                path: "/b"
            }
        ]);
    });

    it("keeps clients isolated when their calls interleave", async () => {
        const clientA = createContentClient({
            apiHost: "https://a.example.com",
            apiKey: "key-a",
            apiTenant: "tenant-a"
        });
        const clientB = createContentClient({
            apiHost: "https://b.example.com",
            apiKey: "key-b",
            apiTenant: "tenant-b"
        });

        // The first request to start is the last to finish.
        delays["/a"] = 20;
        delays["/b"] = 0;

        const [pageA, pageB] = await Promise.all([clientA.getPage("/a"), clientB.getPage("/b")]);

        expect(pageA?.properties.path).toBe("/a");
        expect(pageB?.properties.path).toBe("/b");

        const requestA = requests.find(request => request.path === "/a");
        const requestB = requests.find(request => request.path === "/b");

        expect(requestA).toMatchObject({
            url: "https://a.example.com/graphql",
            tenant: "tenant-a",
            authorization: "Bearer key-a"
        });
        expect(requestB).toMatchObject({
            url: "https://b.example.com/graphql",
            tenant: "tenant-b",
            authorization: "Bearer key-b"
        });
    });

    it("does not change what the contentSdk singleton sends, and init() does not change a client", async () => {
        contentSdk.init({
            apiHost: "https://singleton.example.com",
            apiKey: "key-singleton",
            apiTenant: "root"
        });

        const client = createContentClient({
            apiHost: "https://client.example.com",
            apiKey: "key-client",
            apiTenant: "tenant-client"
        });

        await contentSdk.getPage("/singleton");

        contentSdk.init({
            apiHost: "https://singleton-2.example.com",
            apiKey: "key-singleton-2",
            apiTenant: "root-2"
        });

        await client.getPage("/client");
        await contentSdk.getPage("/singleton-2");

        expect(requests).toEqual([
            {
                url: "https://singleton.example.com/graphql",
                tenant: "root",
                authorization: "Bearer key-singleton",
                path: "/singleton"
            },
            {
                url: "https://client.example.com/graphql",
                tenant: "tenant-client",
                authorization: "Bearer key-client",
                path: "/client"
            },
            {
                url: "https://singleton-2.example.com/graphql",
                tenant: "root-2",
                authorization: "Bearer key-singleton-2",
                path: "/singleton-2"
            }
        ]);
    });

    it("keeps the preview flag per client", () => {
        const live = createContentClient({
            apiHost: "https://a.example.com",
            apiKey: "key-a",
            apiTenant: "tenant-a"
        });
        const preview = createContentClient({
            apiHost: "https://a.example.com",
            apiKey: "key-a",
            apiTenant: "tenant-a",
            preview: true,
            previewParams: "wb.type=page&wb.path=/a&wb.id=page-1"
        });

        expect(live.isPreviewing()).toBe(false);
        expect(preview.isPreviewing()).toBe(true);
    });
});
