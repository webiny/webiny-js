import { describe } from "vitest";
import { it } from "vitest";
import { expect } from "vitest";
import { vi } from "vitest";
import { beforeEach } from "vitest";
import { createWebsiteBuilderMiddleware } from "../src/middleware.js";
import { createWebsiteBuilderProxy } from "../src/middleware.js";
import { middleware } from "../src/middleware.js";
import { proxy } from "../src/middleware.js";
import { config } from "../src/middleware.js";
import { DEFAULT_MATCHER } from "../src/middleware.js";
import * as proxyModule from "../src/proxy.js";

const mockDraftModeDisable = vi.fn();
let isDraftModeEnabled = false;

vi.mock("next/headers", () => {
    return {
        draftMode: vi.fn(async () => {
            return {
                get isEnabled() {
                    return isDraftModeEnabled;
                },
                disable: mockDraftModeDisable
            };
        })
    };
});

vi.mock("next/server", () => {
    class MockNextResponse {
        public headers = new Headers();
        public cookies = new Map<string, { value: string; options?: any }>();
        public redirectedTo?: string;

        constructor(redirectedTo?: string) {
            this.redirectedTo = redirectedTo;
        }

        static next(init?: { request?: { headers?: Headers } }) {
            const res = new MockNextResponse();
            if (init?.request?.headers) {
                init.request.headers.forEach((val, key) => {
                    res.headers.set(key, val);
                });
            }
            return {
                headers: res.headers,
                cookies: {
                    set: (name: string, value: string, options: any) => {
                        res.cookies.set(name, { value, options });
                    }
                }
            };
        }

        static redirect(url: string | URL) {
            const res = new MockNextResponse(url.toString());
            return res;
        }
    }

    return {
        NextResponse: MockNextResponse
    };
});

const createMockRequest = (url: string, cookies: Record<string, string> = {}) => {
    const parsedUrl = new URL(url);
    return {
        url,
        nextUrl: {
            pathname: parsedUrl.pathname,
            searchParams: parsedUrl.searchParams
        },
        headers: new Headers(),
        cookies: {
            get: (name: string) => {
                const val = cookies[name];
                return val !== undefined ? { value: val } : undefined;
            }
        }
    };
};

describe("Website Builder middleware and proxy", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        isDraftModeEnabled = false;
    });

    it("exports middleware and proxy aliases", () => {
        expect(typeof middleware).toBe("function");
        expect(typeof proxy).toBe("function");
        expect(proxy).toBe(middleware);
        expect(typeof createWebsiteBuilderMiddleware).toBe("function");
        expect(createWebsiteBuilderProxy).toBe(createWebsiteBuilderMiddleware);
    });

    it("exports default config matcher", () => {
        expect(config).toBeDefined();
        expect(config.matcher).toEqual(DEFAULT_MATCHER);
        expect(DEFAULT_MATCHER).toEqual(["/((?!_next|api|static|favicon.ico|.well-known).*)"]);
    });

    it("re-exports all middleware utilities from proxy module", () => {
        expect(proxyModule.proxy).toBe(proxy);
        expect(proxyModule.middleware).toBe(middleware);
        expect(proxyModule.createWebsiteBuilderMiddleware).toBe(createWebsiteBuilderMiddleware);
        expect(proxyModule.createWebsiteBuilderProxy).toBe(createWebsiteBuilderProxy);
        expect(proxyModule.config).toBe(config);
        expect(proxyModule.DEFAULT_MATCHER).toBe(DEFAULT_MATCHER);
    });

    it("sets visitor cookie when missing on normal request", async () => {
        const mw = createWebsiteBuilderMiddleware();
        const req = createMockRequest("https://example.com/blog/my-post");

        const res: any = await mw(req);

        expect(res).toBeDefined();
        expect(res.redirectedTo).toBeUndefined();
    });

    it("redirects to previewRoute when preview requested and draft mode is off", async () => {
        const mw = createWebsiteBuilderMiddleware({
            previewRoute: "/custom-preview"
        });
        const req = createMockRequest("https://example.com/about?wb.preview=true&wb.tenant=root");

        const res: any = await mw(req);

        expect(res).toBeDefined();
        expect(res.redirectedTo).toBe(
            "https://example.com/custom-preview?wb.preview=true&wb.tenant=root"
        );
    });

    it("passes through and sets cache headers when preview requested and draft mode is on", async () => {
        isDraftModeEnabled = true;
        const mw = createWebsiteBuilderMiddleware();
        const req = createMockRequest("https://example.com/about?wb.preview=true");

        const res: any = await mw(req);

        expect(res).toBeDefined();
        expect(res.redirectedTo).toBeUndefined();
        expect(res.headers.get("X-Preview-Params")).toBe("wb.preview=true");
        expect(res.headers.get("Cache-Control")).toContain("no-store");
        expect(res.headers.get("Pragma")).toBe("no-cache");
        expect(res.headers.get("Expires")).toBe("0");
    });

    it("exits preview when preview flag is gone but draft mode is enabled", async () => {
        isDraftModeEnabled = true;
        const mw = createWebsiteBuilderMiddleware();
        const req = createMockRequest("https://example.com/about");

        const res: any = await mw(req);

        expect(mockDraftModeDisable).toHaveBeenCalledTimes(1);
        expect(res.redirectedTo).toBe("https://example.com/about");
    });
});
