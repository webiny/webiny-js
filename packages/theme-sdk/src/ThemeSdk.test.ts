import { describe, expect, it, vi } from "vitest";
import {
    ACTIVE_THEME_PATH,
    buildGoogleFontsUrl,
    createThemeRewrite,
    getFontLinkTags,
    getThemeLinkTags,
    GOOGLE_FONTS_STATIC_ORIGIN,
    shouldRevalidateTheme,
    THEME_CACHE_TAG,
    THEME_ROUTE_PREFIX,
    ThemeSdk
} from "./ThemeSdk.js";
import type { ActiveTheme, ThemeFont } from "./types.js";

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

describe("shouldRevalidateTheme", () => {
    it("revalidates on activation and deactivation — the events that change what is live", () => {
        expect(shouldRevalidateTheme("theme.activated")).toBe(true);
        expect(shouldRevalidateTheme("theme.deactivated")).toBe(true);
    });

    it("ignores events that do not move the active pointer", () => {
        // Publishing mints an immutable version but does not change what is active; drafts never do.
        for (const event of [
            "theme.created",
            "theme.updated",
            "theme.deleted",
            "theme.published",
            "something.else"
        ]) {
            expect(shouldRevalidateTheme(event), event).toBe(false);
        }
    });
});

describe("requestInit passthrough", () => {
    it("merges caller requestInit into the active-theme fetch (for cache tagging)", async () => {
        let init: RequestInit | undefined;
        const capture: typeof fetch = (_url, i) => {
            init = i;
            return Promise.resolve(jsonResponse(activeBody));
        };

        await new ThemeSdk({
            apiHost: API,
            fetch: capture,
            // What a Next.js app passes so `revalidateTag(THEME_CACHE_TAG)` works.
            requestInit: { next: { tags: [THEME_CACHE_TAG] } } as RequestInit
        }).getActiveTheme();

        expect((init as { next?: { tags: string[] } }).next?.tags).toEqual([THEME_CACHE_TAG]);
    });

    it("does not let requestInit clobber the timeout signal", async () => {
        // A caller-provided signal must not replace the client's abort signal, or the timeout is lost.
        let init: RequestInit | undefined;
        const capture: typeof fetch = (_url, i) => {
            init = i;
            return Promise.resolve(jsonResponse(activeBody));
        };

        await new ThemeSdk({
            apiHost: API,
            fetch: capture,
            requestInit: { signal: undefined, cache: "no-store" }
        }).getActiveTheme();

        expect(init?.signal).toBeInstanceOf(AbortSignal);
        expect((init as RequestInit).cache).toBe("no-store");
    });

    it("still sends auth headers alongside requestInit", async () => {
        let sent: Record<string, string> | undefined;
        const capture: typeof fetch = (_url, i) => {
            sent = i?.headers as Record<string, string>;
            return Promise.resolve(jsonResponse(activeBody));
        };

        await new ThemeSdk({
            apiHost: API,
            apiKey: "k",
            fetch: capture,
            requestInit: { headers: { "x-custom": "1" } }
        }).getActiveTheme();

        expect(sent?.["authorization"]).toBe("Bearer k");
        expect(sent?.["x-custom"]).toBe("1");
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

describe("ThemeSdk.getFonts", () => {
    const active: ActiveTheme = {
        themeId: "t",
        version: 1,
        activatedOn: "",
        artifacts: {
            css: `${API}/_webiny/theme/t/1/tokens.css`,
            json: `${API}/_webiny/theme/t/1/tokens.json`
        }
    };

    const jsonArtifact = {
        fonts: [
            {
                key: "sans",
                family: "Inter",
                weights: [400, 600],
                styles: ["normal"],
                display: "swap"
            }
        ]
    };

    it("reads fonts from the JSON artifact", async () => {
        const sdk = sdkWith(() => Promise.resolve(jsonResponse(jsonArtifact)));

        const fonts = await sdk.getFonts(active);
        expect(fonts).toEqual<ThemeFont[]>([
            { family: "Inter", weights: [400, 600], styles: ["normal"], display: "swap" }
        ]);
    });

    it("fetches the JSON artifact URL", async () => {
        const fetchImpl = vi.fn(() => Promise.resolve(jsonResponse(jsonArtifact)));
        await sdkWith(fetchImpl as unknown as typeof fetch).getFonts(active);

        expect(fetchImpl).toHaveBeenCalledWith(active.artifacts.json, expect.anything());
    });

    it("resolves a same-origin relative artifact URL to absolute before fetching", async () => {
        // SSR fetch needs an origin; a relative path (same-origin mode) has none.
        const fetchImpl = vi.fn(() => Promise.resolve(jsonResponse(jsonArtifact)));
        const relativeActive: ActiveTheme = {
            ...active,
            artifacts: {
                css: "/_webiny/theme/t/1/tokens.css",
                json: "/_webiny/theme/t/1/tokens.json"
            }
        };

        await sdkWith(fetchImpl as unknown as typeof fetch, { sameOrigin: true }).getFonts(
            relativeActive
        );

        expect(fetchImpl).toHaveBeenCalledWith(
            `${API}/_webiny/theme/t/1/tokens.json`,
            expect.anything()
        );
    });

    it("returns [] rather than throwing on any failure", async () => {
        expect(await sdkWith(() => Promise.reject(new Error("boom"))).getFonts(active)).toEqual([]);
        expect(
            await sdkWith(() => Promise.resolve(jsonResponse({}, false, 500))).getFonts(active)
        ).toEqual([]);
    });

    it("drops malformed font entries rather than trusting them", async () => {
        const sdk = sdkWith(() =>
            Promise.resolve(
                jsonResponse({
                    fonts: [
                        { family: "Inter", weights: [400], styles: ["normal"] },
                        { weights: [700] }, // no family — dropped
                        null,
                        "nonsense"
                    ]
                })
            )
        );

        const fonts = await sdk.getFonts(active);
        expect(fonts).toHaveLength(1);
        expect(fonts[0].family).toBe("Inter");
    });

    it("treats a JSON artifact with no fonts as empty", async () => {
        const sdk = sdkWith(() => Promise.resolve(jsonResponse({ tokens: [] })));
        expect(await sdk.getFonts(active)).toEqual([]);
    });
});

describe("buildGoogleFontsUrl", () => {
    it("requests a family with its weights", () => {
        const url = buildGoogleFontsUrl([
            { family: "Inter", weights: [400, 600], styles: ["normal"] }
        ]);
        expect(url).toBe(
            "https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap"
        );
    });

    it("encodes a multi-word family name", () => {
        const url = buildGoogleFontsUrl([
            { family: "Open Sans", weights: [400], styles: ["normal"] }
        ]);
        expect(url).toContain("family=Open+Sans:wght@400");
    });

    it("emits sorted ital,wght tuples when italic is used", () => {
        const url = buildGoogleFontsUrl([
            { family: "Inter", weights: [600, 400], styles: ["normal", "italic"] }
        ]);
        // Weights de-duplicated + sorted; normal (0) tuples before italic (1).
        expect(url).toContain("family=Inter:ital,wght@0,400;0,600;1,400;1,600");
    });

    it("combines multiple families with &family=", () => {
        const url = buildGoogleFontsUrl([
            { family: "Inter", weights: [400], styles: ["normal"] },
            { family: "Lora", weights: [500], styles: ["normal"] }
        ]);
        expect(url).toBe(
            "https://fonts.googleapis.com/css2?family=Inter:wght@400&family=Lora:wght@500&display=swap"
        );
    });

    it("falls back to the family default when no weights are given", () => {
        const url = buildGoogleFontsUrl([{ family: "Inter", weights: [], styles: [] }]);
        expect(url).toBe("https://fonts.googleapis.com/css2?family=Inter&display=swap");
    });

    it("is null for no fonts", () => {
        expect(buildGoogleFontsUrl([])).toBeNull();
    });
});

describe("getFontLinkTags", () => {
    it("preconnects to both Google origins, then loads the stylesheet", () => {
        const tags = getFontLinkTags([{ family: "Inter", weights: [400], styles: ["normal"] }]);

        expect(tags.map(t => t.rel)).toEqual(["preconnect", "preconnect", "stylesheet"]);
        // The gstatic preconnect must carry crossorigin, or the connection is not reused.
        const gstatic = tags.find(t => t.href === GOOGLE_FONTS_STATIC_ORIGIN);
        expect(gstatic?.crossOrigin).toBe("anonymous");
        expect(tags.at(-1)?.href).toContain("css2?family=Inter");
    });

    it("emits nothing for a theme with no web fonts", () => {
        expect(getFontLinkTags([])).toEqual([]);
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
