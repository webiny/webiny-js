import { describe, it, expect, vi, afterEach } from "vitest";
import { HttpError } from "@webiny/sdk";
import { ApiError } from "@webiny/sdk";
import { NetworkError } from "@webiny/sdk";
import { ComponentsSdk } from "./ComponentsSdk.js";
import type { RemoteComponentEntry } from "./ComponentsSdk.js";

const endpoint = "https://api.example.com";

const entry: RemoteComponentEntry = {
    id: "c1",
    name: "acme/hero",
    label: "Hero",
    bundledJs: "",
    bundledJsSha256: "",
    bundledCss: "",
    bundledCssSha256: "",
    sdkVersion: "1",
    status: "published"
};

function jsonResponse(body: unknown, status = 200): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: { "Content-Type": "application/json" }
    });
}

function listResponse(data: RemoteComponentEntry[]): Response {
    return jsonResponse({
        data: { remoteComponents: { listRemoteComponents: { data, error: null } } }
    });
}

// Behaves like a browser's `fetch`: only `globalThis` or `undefined` are accepted as the receiver.
function browserLikeFetch(this: unknown): Promise<Response> {
    if (this !== globalThis && this !== undefined) {
        throw new TypeError("Failed to execute 'fetch' on 'Window': Illegal invocation");
    }
    return Promise.resolve(listResponse([]));
}

afterEach(() => {
    vi.unstubAllGlobals();
});

describe("ComponentsSdk.loadComponents", () => {
    describe("fetch receiver", () => {
        it("calls the global fetch without the SDK instance as receiver", async () => {
            vi.stubGlobal("fetch", browserLikeFetch);
            const sdk = new ComponentsSdk({ endpoint });

            const result = await sdk.loadComponents();

            expect(result.isOk()).toBe(true);
            expect(result.value).toEqual([]);
        });

        it("calls config.fetch without the SDK instance as receiver", async () => {
            const sdk = new ComponentsSdk({ endpoint, fetch: browserLikeFetch as typeof fetch });

            const result = await sdk.loadComponents();

            expect(result.isOk()).toBe(true);
            expect(result.value).toEqual([]);
        });
    });

    describe("request and result", () => {
        it("sends the same URL and init", async () => {
            const fetchFn = vi.fn(async () => listResponse([entry]));
            const sdk = new ComponentsSdk({
                endpoint,
                tenant: "acme",
                token: "secret",
                headers: { "x-custom": "1" },
                fetch: fetchFn
            });

            await sdk.loadComponents({
                fetchOptions: { cache: "no-store", method: "GET" }
            });

            expect(fetchFn).toHaveBeenCalledTimes(1);
            const [url, init] = fetchFn.mock.calls[0] as unknown as [string, RequestInit];
            expect(url).toBe(`${endpoint}/graphql`);
            expect(init).toEqual({
                // `fetchOptions` is spread last, so it overrides `method`.
                method: "GET",
                cache: "no-store",
                headers: {
                    "Content-Type": "application/json",
                    "x-tenant": "acme",
                    "x-custom": "1",
                    Authorization: "Bearer secret"
                },
                body: expect.stringContaining("listRemoteComponents")
            });
            expect(JSON.parse(init.body as string)).toEqual({ query: expect.any(String) });
        });

        it("defaults the tenant and resolves a token function", async () => {
            const fetchFn = vi.fn(async () => listResponse([]));
            const sdk = new ComponentsSdk({
                endpoint,
                token: async () => "from-fn",
                fetch: fetchFn
            });

            await sdk.loadComponents();

            const [, init] = fetchFn.mock.calls[0] as unknown as [string, RequestInit];
            expect(init.method).toBe("POST");
            expect(init.headers).toEqual({
                "Content-Type": "application/json",
                "x-tenant": "root",
                Authorization: "Bearer from-fn"
            });
        });

        it("returns the components on an OK response", async () => {
            const sdk = new ComponentsSdk({
                endpoint,
                fetch: vi.fn(async () => listResponse([entry]))
            });

            const result = await sdk.loadComponents();

            expect(result.isOk()).toBe(true);
            expect(result.value).toEqual([entry]);
        });

        it("returns an HttpError on a non-OK status", async () => {
            const sdk = new ComponentsSdk({
                endpoint,
                fetch: vi.fn(async () => jsonResponse({}, 503))
            });

            const result = await sdk.loadComponents();

            expect(result.isFail()).toBe(true);
            expect(result.error).toBeInstanceOf(HttpError);
            expect(result.error.message).toBe("HTTP error! status: 503");
            expect(result.error.data).toEqual({ status: 503 });
        });

        it("returns a NetworkError when fetch throws", async () => {
            const sdk = new ComponentsSdk({
                endpoint,
                fetch: vi.fn(async () => {
                    throw new Error("connection refused");
                })
            });

            const result = await sdk.loadComponents();

            expect(result.isFail()).toBe(true);
            expect(result.error).toBeInstanceOf(NetworkError);
            expect(result.error.message).toBe("connection refused");
        });

        it("returns an ApiError on a GraphQL errors response", async () => {
            const sdk = new ComponentsSdk({
                endpoint,
                fetch: vi.fn(async () => jsonResponse({ errors: [{ message: "Not authorized" }] }))
            });

            const result = await sdk.loadComponents();

            expect(result.isFail()).toBe(true);
            expect(result.error).toBeInstanceOf(ApiError);
            expect(result.error.message).toBe("Not authorized");
        });
    });
});
