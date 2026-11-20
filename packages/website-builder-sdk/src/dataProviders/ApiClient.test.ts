import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiClient } from "./ApiClient.js";

const mockFetch = () => {
    const fetchMock = vi.fn().mockResolvedValue({ json: async () => ({ data: {} }) });
    vi.stubGlobal("fetch", fetchMock);
    return fetchMock;
};

const sentHeaders = (fetchMock: ReturnType<typeof mockFetch>, call = 0) => {
    return fetchMock.mock.calls[call][1].headers as Record<string, string>;
};

const config = {
    apiHost: "https://api.test",
    apiKey: "key",
    apiTenant: "root"
};

describe("ApiClient headers", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("sends the configured headers with every request", async () => {
        const fetchMock = mockFetch();
        const client = new ApiClient({ ...config, headers: { "x-extra": "a" } });

        await client.query({ query: "{ a }", variables: {} });
        await client.fetch({ path: "/wb/redirects" });

        expect(sentHeaders(fetchMock, 0)["x-extra"]).toBe("a");
        expect(sentHeaders(fetchMock, 1)["x-extra"]).toBe("a");
    });

    it("calls a headers function before each request", async () => {
        const fetchMock = mockFetch();
        let value = "first";
        const client = new ApiClient({
            ...config,
            headers: async () => ({ "x-extra": value })
        });

        await client.query({ query: "{ a }", variables: {} });
        value = "second";
        await client.query({ query: "{ a }", variables: {} });

        expect(sentHeaders(fetchMock, 0)["x-extra"]).toBe("first");
        expect(sentHeaders(fetchMock, 1)["x-extra"]).toBe("second");
    });

    it("doesn't let extra headers replace the tenant or the API key", async () => {
        const fetchMock = mockFetch();
        const client = new ApiClient({
            ...config,
            headers: { "X-Tenant": "other", Authorization: "Bearer other" }
        });

        await client.query({ query: "{ a }", variables: {} });

        expect(sentHeaders(fetchMock)["X-Tenant"]).toBe("root");
        expect(sentHeaders(fetchMock).Authorization).toBe("Bearer key");
    });

    it("doesn't send a configured tenant or API key in another case either", async () => {
        const fetchMock = mockFetch();
        const client = new ApiClient({
            ...config,
            headers: {
                "x-tenant": "other",
                authorization: "Bearer other",
                "x-extra": "a"
            }
        });

        await client.query({ query: "{ a }", variables: {} });

        expect(sentHeaders(fetchMock)).toMatchObject({
            "X-Tenant": "root",
            Authorization: "Bearer key",
            "x-extra": "a"
        });
        expect(sentHeaders(fetchMock)).not.toHaveProperty("x-tenant");
        expect(sentHeaders(fetchMock)).not.toHaveProperty("authorization");
    });

    it("lets a configured header replace the content type, whatever the case", async () => {
        const fetchMock = mockFetch();
        const client = new ApiClient({
            ...config,
            headers: { "content-type": "application/graphql+json" }
        });

        await client.query({ query: "{ a }", variables: {} });

        expect(sentHeaders(fetchMock)["content-type"]).toBe("application/graphql+json");
        expect(sentHeaders(fetchMock)).not.toHaveProperty("Content-Type");
    });
});
