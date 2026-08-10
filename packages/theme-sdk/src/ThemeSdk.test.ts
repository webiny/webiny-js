import { describe, expect, it, vi } from "vitest";
import {
    createNuxtThemeRouteRules,
    createThemeRewrite,
    GOOGLE_FONTS_STATIC_ORIGIN,
    THEME_ARTIFACT_PATHS,
    THEME_ROUTE_PREFIX,
    ThemeSdk
} from "./ThemeSdk.js";

const API = "https://d123.cloudfront.net";

const jsonResponse = (body: unknown, ok = true, status = 200) =>
    ({ ok, status, json: () => Promise.resolve(body) }) as Response;

const sdkWith = (
    fetchImpl: typeof fetch,
    over: Partial<ConstructorParameters<typeof ThemeSdk>[0]> = {}
) => new ThemeSdk({ apiHost: API, fetch: fetchImpl, ...over });

describe("ThemeSdk.artifactUrl", () => {
    const sdk = sdkWith(() => Promise.resolve(jsonResponse({})));

    it("builds absolute stable URLs by default", () => {
        expect(sdk.artifactUrl("css")).toBe(`${API}/_webiny/theme/tokens.css`);
        expect(sdk.artifactUrl("json")).toBe(`${API}/_webiny/theme/tokens.json`);
        expect(sdk.artifactUrl("manifest")).toBe(`${API}/_webiny/theme/manifest.json`);
    });

    it("carries no version in the path — delivery serves whichever version is active", () => {
        expect(sdk.artifactUrl("css")).not.toMatch(/\/\d+\//);
    });

    it("keeps URLs relative in same-origin mode, for the proxy to serve", () => {
        const same = sdkWith(() => Promise.resolve(jsonResponse({})), { sameOrigin: true });
        expect(same.artifactUrl("css")).toBe("/_webiny/theme/tokens.css");
    });

    it("addresses a specific draft under /preview for a preview override", () => {
        expect(sdk.artifactUrl("css", { themeId: "wbyTheme-abc", version: 5 })).toBe(
            `${API}/_webiny/theme/preview/wbyTheme-abc/5/tokens.css`
        );
    });

    it("tolerates a trailing slash on the API host", () => {
        const trailing = new ThemeSdk({ apiHost: `${API}/` });
        expect(trailing.artifactUrl("css")).toBe(`${API}/_webiny/theme/tokens.css`);
    });
});

describe("ThemeSdk.getHeadTags", () => {
    const sdk = sdkWith(() => Promise.resolve(jsonResponse({})));

    it("preconnects to the Google Fonts file origin, then links the stable stylesheet", () => {
        const tags = sdk.getHeadTags();

        expect(tags.map(tag => tag.rel)).toEqual(["preconnect", "stylesheet"]);
        // Fonts load from the stylesheet's @import, so the only font hint here is the preconnect —
        // which must carry crossorigin or the connection is not reused.
        const preconnect = tags.find(tag => tag.rel === "preconnect");
        expect(preconnect?.href).toBe(GOOGLE_FONTS_STATIC_ORIGIN);
        expect(preconnect?.crossOrigin).toBe("anonymous");
        expect(tags.at(-1)).toEqual({ rel: "stylesheet", href: `${API}/_webiny/theme/tokens.css` });
    });

    it("emits the tags with no theme resolution — always the same stable link", () => {
        // A themeless site serves a 204 at that URL, so the link is harmless and needs no fetch.
        const fetchImpl = vi.fn(() => Promise.resolve(jsonResponse({})));
        sdkWith(fetchImpl as unknown as typeof fetch).getHeadTags();
        expect(fetchImpl).not.toHaveBeenCalled();
    });

    it("points at the preview stylesheet when previewing a draft", () => {
        const tags = sdk.getHeadTags({ themeId: "t", version: 2 });
        expect(tags.at(-1)?.href).toBe(`${API}/_webiny/theme/preview/t/2/tokens.css`);
    });
});

describe("ThemeSdk.getTheme", () => {
    it("fetches the stable JSON artifact absolutely, even in same-origin mode", async () => {
        const fetchImpl = vi.fn(() => Promise.resolve(jsonResponse({ policy: {} })));
        await sdkWith(fetchImpl as unknown as typeof fetch, { sameOrigin: true }).getTheme();

        expect(fetchImpl).toHaveBeenCalledWith(
            `${API}${THEME_ARTIFACT_PATHS.json}`,
            expect.anything()
        );
    });

    it("returns the parsed payload", async () => {
        const sdk = sdkWith(() => Promise.resolve(jsonResponse({ schemaVersion: 1, policy: {} })));
        expect(await sdk.getTheme()).toEqual({ schemaVersion: 1, policy: {} });
    });

    it("returns null on a 204 — the backend's 'no active theme' answer", async () => {
        const sdk = sdkWith(() => Promise.resolve(jsonResponse(null, true, 204)));
        expect(await sdk.getTheme()).toBeNull();
    });

    it("returns null rather than throwing on a network error or non-2xx", async () => {
        expect(await sdkWith(() => Promise.reject(new Error("x"))).getTheme()).toBeNull();
        expect(
            await sdkWith(() => Promise.resolve(jsonResponse({}, false, 503))).getTheme()
        ).toBeNull();
    });

    it("does not hang: aborts and returns null past the timeout", async () => {
        const never: typeof fetch = (_url, init) =>
            new Promise((_resolve, reject) => {
                init?.signal?.addEventListener("abort", () => reject(new Error("aborted")));
            });
        expect(await sdkWith(never, { timeoutMs: 10 }).getTheme()).toBeNull();
    });

    it("sends auth headers only when a key and tenant are configured", async () => {
        let sent: Record<string, string> | undefined;
        const capture: typeof fetch = (_url, init) => {
            sent = init?.headers as Record<string, string>;
            return Promise.resolve(jsonResponse({}));
        };

        await new ThemeSdk({
            apiHost: API,
            apiKey: "a-key",
            apiTenant: "acme",
            fetch: capture
        }).getTheme();
        expect(sent?.["authorization"]).toBe("Bearer a-key");
        expect(sent?.["x-tenant"]).toBe("acme");

        let none: Record<string, string> | undefined;
        await sdkWith((_url, init) => {
            none = init?.headers as Record<string, string>;
            return Promise.resolve(jsonResponse({}));
        }).getTheme();
        expect(none).toEqual({});
    });

    it("merges requestInit without clobbering the timeout signal", async () => {
        let init: RequestInit | undefined;
        const capture: typeof fetch = (_url, i) => {
            init = i;
            return Promise.resolve(jsonResponse({}));
        };

        await new ThemeSdk({
            apiHost: API,
            fetch: capture,
            requestInit: { cache: "no-store", next: { revalidate: 60 } } as RequestInit
        }).getTheme();

        expect(init?.signal).toBeInstanceOf(AbortSignal);
        expect((init as RequestInit).cache).toBe("no-store");
        expect((init as { next?: { revalidate: number } }).next?.revalidate).toBe(60);
    });
});

describe("createThemeRewrite", () => {
    it("builds a same-origin proxy rule covering every theme route under one prefix", () => {
        expect(createThemeRewrite(API)).toEqual({
            source: `${THEME_ROUTE_PREFIX}/:path*`,
            destination: `${API}${THEME_ROUTE_PREFIX}/:path*`
        });
    });

    it("tolerates a trailing slash on the API host", () => {
        expect(createThemeRewrite(`${API}/`).destination).toBe(
            `${API}${THEME_ROUTE_PREFIX}/:path*`
        );
    });
});

describe("createNuxtThemeRouteRules (Nuxt parity)", () => {
    it("builds a Nitro route-rules proxy with ** wildcards", () => {
        expect(createNuxtThemeRouteRules(API)).toEqual({
            [`${THEME_ROUTE_PREFIX}/**`]: { proxy: `${API}${THEME_ROUTE_PREFIX}/**` }
        });
    });

    it("proxies the same prefix as the Next.js rewrite, differing only in wildcard syntax", () => {
        const next = createThemeRewrite(API);
        const nuxt = createNuxtThemeRouteRules(API);
        expect(Object.keys(nuxt)[0]).toBe(next.source.replace(":path*", "**"));
        expect(nuxt[`${THEME_ROUTE_PREFIX}/**`].proxy).toBe(
            next.destination.replace(":path*", "**")
        );
    });
});
