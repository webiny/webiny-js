import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as React from "react";
import { renderToString } from "react-dom/server";
import type { RemoteComponentEntry } from "@webiny/sdk-frontend";
import { GraphQLRemoteComponentLoader } from "../src/remoteComponents/GraphQLRemoteComponentLoader.js";
import { createGraphQLComponentLoader } from "../src/remoteComponents/createGraphQLComponentLoader.js";

const config = {
    apiHost: "https://api.example.com",
    apiKey: "secret",
    apiTenant: "acme",
    locale: "de-DE"
};

// A bundle that renders the runtime environment it was hydrated with.
const bundledJs = `
__remoteComponent__ = {
    createComponent: function (runtime) {
        var React = runtime.dependencies.React;
        var env = runtime.environment;
        return {
            component: function Hero() {
                return React.createElement("p", null, [env.tenantId, env.locale, env.mode].join("|"));
            },
            manifest: { name: "acme/hero", hasSdk: typeof runtime.dependencies.sdk.createComponent }
        };
    }
};
`;

const entry: RemoteComponentEntry = {
    id: "c1",
    name: "acme/hero",
    label: "Hero",
    bundledJs,
    bundledJsSha256: "",
    bundledCss: "",
    bundledCssSha256: "",
    sdkVersion: "1",
    status: "published"
};

function listResponse(data: RemoteComponentEntry[]): Response {
    const body = { data: { remoteComponents: { listRemoteComponents: { data, error: null } } } };
    return new Response(JSON.stringify(body), {
        status: 200,
        headers: { "Content-Type": "application/json" }
    });
}

function failedResponse(): Response {
    return new Response("Service Unavailable", { status: 503 });
}

let fetchFn: ReturnType<typeof vi.fn<(url: string, init: RequestInit) => Promise<Response>>>;

beforeEach(() => {
    fetchFn = vi.fn<(url: string, init: RequestInit) => Promise<Response>>();
    vi.stubGlobal("fetch", fetchFn);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
});

describe("GraphQLRemoteComponentLoader.loadComponents", () => {
    it("sends the same request and hydrates the components on the server", async () => {
        fetchFn.mockResolvedValue(listResponse([entry]));
        const loader = new GraphQLRemoteComponentLoader(config);

        const components = await loader.loadComponents();

        expect(fetchFn).toHaveBeenCalledTimes(1);
        const [url, init] = fetchFn.mock.calls[0];
        expect(url).toBe("https://api.example.com/graphql");
        expect(init).toEqual({
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-tenant": "acme",
                Authorization: "Bearer secret"
            },
            body: expect.stringContaining("listRemoteComponents"),
            next: { revalidate: 60 }
        });

        expect(components).toHaveLength(1);
        expect(components[0].manifest).toEqual({ name: "acme/hero", hasSdk: "function" });
        const element = React.createElement(components[0].component);
        const html = renderToString(element);
        expect(html).toBe(`<div class="rc-acme-hero"><p>acme|de-DE|server</p></div>`);
    });

    it("caches a successful load", async () => {
        fetchFn.mockResolvedValue(listResponse([entry]));
        const loader = new GraphQLRemoteComponentLoader(config);

        const first = await loader.loadComponents();
        const second = await loader.loadComponents();

        expect(second).toBe(first);
        expect(fetchFn).toHaveBeenCalledTimes(1);
    });

    it("caches a successful empty answer", async () => {
        fetchFn.mockResolvedValue(listResponse([]));
        const loader = new GraphQLRemoteComponentLoader(config);

        expect(await loader.loadComponents()).toEqual([]);
        expect(await loader.loadComponents()).toEqual([]);
        expect(fetchFn).toHaveBeenCalledTimes(1);
    });

    it("doesn't cache a failed load and retries on the next call", async () => {
        fetchFn.mockResolvedValueOnce(failedResponse());
        fetchFn.mockResolvedValueOnce(listResponse([entry]));
        const loader = new GraphQLRemoteComponentLoader(config);

        const first = await loader.loadComponents();
        const second = await loader.loadComponents();

        expect(first).toEqual([]);
        expect(second).toHaveLength(1);
        expect(second[0].manifest.name).toBe("acme/hero");
        expect(fetchFn).toHaveBeenCalledTimes(2);
        expect(console.error).toHaveBeenCalledWith("[RemoteComponents] HTTP error! status: 503");
    });

    it("retries after a network error", async () => {
        fetchFn.mockRejectedValueOnce(new Error("connection refused"));
        fetchFn.mockResolvedValueOnce(listResponse([entry]));
        const loader = new GraphQLRemoteComponentLoader(config);

        expect(await loader.loadComponents()).toEqual([]);
        expect(await loader.loadComponents()).toHaveLength(1);
        expect(fetchFn).toHaveBeenCalledTimes(2);
    });

    it("shares one request between calls made during a load", async () => {
        let respond: (response: Response) => void = () => undefined;
        fetchFn.mockReturnValueOnce(
            new Promise<Response>(resolve => {
                respond = resolve;
            })
        );
        const loader = new GraphQLRemoteComponentLoader(config);

        const first = loader.loadComponents();
        const second = loader.loadComponents();
        respond(listResponse([entry]));
        const results = await Promise.all([first, second]);

        expect(fetchFn).toHaveBeenCalledTimes(1);
        expect(results[0]).toHaveLength(1);
        expect(results[1]).toBe(results[0]);
    });

    it("shares a failed load between its callers, then retries", async () => {
        let respond: (response: Response) => void = () => undefined;
        fetchFn.mockReturnValueOnce(
            new Promise<Response>(resolve => {
                respond = resolve;
            })
        );
        fetchFn.mockResolvedValueOnce(listResponse([entry]));
        const loader = new GraphQLRemoteComponentLoader(config);

        const first = loader.loadComponents();
        const second = loader.loadComponents();
        respond(failedResponse());

        expect(await first).toEqual([]);
        expect(await second).toEqual([]);
        expect(fetchFn).toHaveBeenCalledTimes(1);

        expect(await loader.loadComponents()).toHaveLength(1);
        expect(fetchFn).toHaveBeenCalledTimes(2);
    });
});

describe("createGraphQLComponentLoader", () => {
    type FactoryParams = Parameters<typeof createGraphQLComponentLoader>[0];
    type ComponentRef = Parameters<
        ReturnType<typeof createGraphQLComponentLoader>["loadComponent"]
    >[0];

    const params = { config } as unknown as FactoryParams;
    const heroRef = { name: "acme/hero" } as ComponentRef;

    it("loads a component once and reuses it", async () => {
        fetchFn.mockResolvedValue(listResponse([entry]));
        const loader = createGraphQLComponentLoader(params);

        const results = await Promise.all([
            loader.loadComponent(heroRef),
            loader.loadComponent(heroRef)
        ]);
        const later = await loader.loadComponent(heroRef);

        expect(results[0]?.manifest.name).toBe("acme/hero");
        expect(results[1]).toBe(results[0]);
        expect(later).toBe(results[0]);
        expect(fetchFn).toHaveBeenCalledTimes(1);
    });

    it("retries after a failed load", async () => {
        fetchFn.mockResolvedValueOnce(failedResponse());
        fetchFn.mockResolvedValueOnce(listResponse([entry]));
        const loader = createGraphQLComponentLoader(params);

        const first = await loader.loadComponent(heroRef);
        const second = await loader.loadComponent(heroRef);

        expect(first).toBeNull();
        expect(second?.manifest.name).toBe("acme/hero");
        expect(fetchFn).toHaveBeenCalledTimes(2);
    });
});
