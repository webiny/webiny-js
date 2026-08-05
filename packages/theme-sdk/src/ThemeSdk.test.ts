import { describe, expect, it, vi } from "vitest";
import {
    ACTIVE_THEME_PATH,
    createThemeRewrite,
    getThemeLinkTags,
    THEME_ROUTE_PREFIX,
    ThemeSdk
} from "./ThemeSdk.js";
import type { ActiveTheme } from "./types.js";

const API = "https://d123.cloudfront.net";

const activeBody = {
    active: true,
    themeId: "wbyTheme-abc",
    version: 3,
    activatedOn: "2026-08-05T10:00:00.000Z",
    artifacts: {
        css: "/_webiny/theme/wbyTheme-abc/3/tokens.css",
        json: "/_webiny/theme/wbyTheme-abc/3/tokens.json"
    }
};

const jsonResponse = (body: unknown, ok = true, status = 200) =>
    ({ ok, status, json: () => Promise.resolve(body) }) as Response;

const sdkWith = (
    fetchImpl: typeof fetch,
    over: Partial<ConstructorParameters<typeof ThemeSdk>[0]> = {}
) => new ThemeSdk({ apiHost: API, fetch: fetchImpl, ...over });

describe("ThemeSdk.getActiveTheme", () => {
    it("resolves the active theme with absolute artifact URLs", async () => {
        const sdk = sdkWith(() => Promise.resolve(jsonResponse(activeBody)));

        const active = await sdk.getActiveTheme();

        expect(active).toEqual<ActiveTheme>({
            themeId: "wbyTheme-abc",
            version: 3,
            activatedOn: "2026-08-05T10:00:00.000Z",
            artifacts: {
                // Relative route paths resolved onto the API host so a browser <link> works with no rewrite.
                css: `${API}/_webiny/theme/wbyTheme-abc/3/tokens.css`,
                json: `${API}/_webiny/theme/wbyTheme-abc/3/tokens.json`
            }
        });
    });

    it("calls the active-theme route on the configured host", async () => {
        const fetchImpl = vi.fn(() => Promise.resolve(jsonResponse(activeBody)));
        await sdkWith(fetchImpl as unknown as typeof fetch).getActiveTheme();

        expect(fetchImpl).toHaveBeenCalledWith(`${API}${ACTIVE_THEME_PATH}`, expect.anything());
    });

    it("returns null for a project with no active theme", async () => {
        // The backend's explicit answer is `{ active: false }` with a 200 — not an error.
        const sdk = sdkWith(() => Promise.resolve(jsonResponse({ active: false })));
        expect(await sdk.getActiveTheme()).toBeNull();
    });

    it("returns null rather than throwing on a network error", async () => {
        // A themeless site must render; a failed theme fetch is not a failed page.
        const sdk = sdkWith(() => Promise.reject(new Error("ENOTFOUND")));
        expect(await sdk.getActiveTheme()).toBeNull();
    });

    it("returns null on a non-2xx response", async () => {
        const sdk = sdkWith(() => Promise.resolve(jsonResponse({}, false, 503)));
        expect(await sdk.getActiveTheme()).toBeNull();
    });

    it("returns null on a malformed body missing artifacts", async () => {
        const sdk = sdkWith(() =>
            Promise.resolve(jsonResponse({ active: true, themeId: "x", version: 1 }))
        );
        expect(await sdk.getActiveTheme()).toBeNull();
    });

    it("does not hang: aborts and returns null past the timeout", async () => {
        const never: typeof fetch = (_url, init) =>
            new Promise((_resolve, reject) => {
                init?.signal?.addEventListener("abort", () => reject(new Error("aborted")));
            });

        const sdk = sdkWith(never, { timeoutMs: 10 });
        expect(await sdk.getActiveTheme()).toBeNull();
    });

    it("sends auth headers only when a key and tenant are configured", async () => {
        let sent: Record<string, string> | undefined;
        const capture: typeof fetch = (_url, init) => {
            sent = init?.headers as Record<string, string>;
            return Promise.resolve(jsonResponse(activeBody));
        };

        await new ThemeSdk({
            apiHost: API,
            apiKey: "a-key",
            apiTenant: "acme",
            fetch: capture
        }).getActiveTheme();

        expect(sent?.["authorization"]).toBe("Bearer a-key");
        expect(sent?.["x-tenant"]).toBe("acme");
    });

    it("sends no auth headers when none are configured (public artifacts need none)", async () => {
        let sent: Record<string, string> | undefined;
        const capture: typeof fetch = (_url, init) => {
            sent = init?.headers as Record<string, string>;
            return Promise.resolve(jsonResponse(activeBody));
        };

        await sdkWith(capture).getActiveTheme();

        expect(sent).toEqual({});
    });

    it("tolerates a trailing slash on the API host", async () => {
        const fetchImpl = vi.fn(() => Promise.resolve(jsonResponse(activeBody)));
        await new ThemeSdk({
            apiHost: `${API}/`,
            fetch: fetchImpl as unknown as typeof fetch
        }).getActiveTheme();

        // No doubled slash in the request URL or the resolved artifact URLs.
        expect(fetchImpl).toHaveBeenCalledWith(`${API}${ACTIVE_THEME_PATH}`, expect.anything());
    });

    it("passes an already-absolute artifact URL through unchanged", async () => {
        const absolute = {
            ...activeBody,
            artifacts: {
                css: "https://cdn.example.com/theme.css",
                json: "https://cdn.example.com/theme.json"
            }
        };
        const sdk = sdkWith(() => Promise.resolve(jsonResponse(absolute)));

        const active = await sdk.getActiveTheme();
        expect(active?.artifacts.css).toBe("https://cdn.example.com/theme.css");
    });

    it("keeps artifact URLs relative in same-origin mode", async () => {
        // With the /_webiny/theme/* proxy in place, the browser should fetch same-origin, so the URL
        // stays relative and resolves against the site's own origin.
        const sdk = sdkWith(() => Promise.resolve(jsonResponse(activeBody)), { sameOrigin: true });

        const active = await sdk.getActiveTheme();
        expect(active?.artifacts.css).toBe("/_webiny/theme/wbyTheme-abc/3/tokens.css");
        expect(active?.artifacts.json).toBe("/_webiny/theme/wbyTheme-abc/3/tokens.json");
    });

    it("still fetches the active pointer from the API host in same-origin mode", async () => {
        // Only the artifact <link> goes same-origin; the SSR pointer call is a direct API request.
        const fetchImpl = vi.fn(() => Promise.resolve(jsonResponse(activeBody)));
        await sdkWith(fetchImpl as unknown as typeof fetch, { sameOrigin: true }).getActiveTheme();

        expect(fetchImpl).toHaveBeenCalledWith(`${API}${ACTIVE_THEME_PATH}`, expect.anything());
    });
});

describe("createThemeRewrite", () => {
    it("builds a same-origin proxy rule for the theme routes", () => {
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

    it("covers both the active pointer and the artifacts under one prefix", () => {
        // The wildcard must sit above /active and /<id>/<v>/tokens.css alike.
        expect(ACTIVE_THEME_PATH.startsWith(`${THEME_ROUTE_PREFIX}/`)).toBe(true);
        expect(createThemeRewrite(API).source).toBe(`${THEME_ROUTE_PREFIX}/:path*`);
    });
});

describe("getThemeLinkTags", () => {
    it("produces a stylesheet link for an active theme", () => {
        const active: ActiveTheme = {
            themeId: "t",
            version: 1,
            activatedOn: "",
            artifacts: { css: `${API}/tokens.css`, json: `${API}/tokens.json` }
        };

        expect(getThemeLinkTags(active)).toEqual([
            { rel: "stylesheet", href: `${API}/tokens.css` }
        ]);
    });

    it("produces nothing for a themeless site", () => {
        expect(getThemeLinkTags(null)).toEqual([]);
    });
});
