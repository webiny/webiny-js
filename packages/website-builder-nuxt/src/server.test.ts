import { describe } from "vitest";
import { it } from "vitest";
import { expect } from "vitest";
import { createApp } from "h3";
import { eventHandler } from "h3";
import { toWebHandler } from "h3";
import { createPreviewHandler } from "./server.js";
import { createWebsiteBuilderMiddleware } from "./server.js";
import type { WebsiteBuilderMiddlewareOptions } from "./server.js";

const createServer = (options: WebsiteBuilderMiddlewareOptions = {}) => {
    const previewRoute = options.previewRoute ?? "/api/preview";
    const preview = createPreviewHandler();
    const middleware = createWebsiteBuilderMiddleware(options);
    const page = eventHandler(event => ({ tenantId: event.context.tenantId ?? null }));

    const middlewareHandler = eventHandler(middleware);
    const previewHandler = eventHandler(preview);

    const app = createApp();
    // Registered before the route-mounted handler, like a Nuxt server middleware.
    app.use(middlewareHandler);
    app.use(previewRoute, previewHandler);
    app.use(page);
    const handler = toWebHandler(app);

    return (path: string, cookie?: string) => {
        const request = new Request(`http://localhost${path}`, {
            headers: cookie ? { cookie } : {},
            redirect: "manual"
        });
        return handler(request);
    };
};

describe("createWebsiteBuilderMiddleware", () => {
    it("sends preview requests to the preview route, keeping the query", async () => {
        const request = createServer();
        const res = await request("/about?wb.preview=true&wb.path=/about&wb.tenant=acme");

        expect(res.status).toBe(307);
        expect(res.headers.get("location")).toBe(
            "/api/preview?wb.preview=true&wb.path=%2Fabout&wb.tenant=acme"
        );
    });

    it("serves preview requests uncached once the preview cookie is set", async () => {
        const request = createServer();
        const res = await request("/about?wb.editing=true&wb.tenant=acme", "__wb_preview=1");

        expect(res.status).toBe(200);
        expect(res.headers.get("cache-control")).toContain("no-store");
        expect(res.headers.get("x-preview-params")).toBe("wb.editing=true&wb.tenant=acme");
        expect(await res.json()).toEqual({ tenantId: "acme" });
    });

    it("exits preview mode when the preview flag is gone", async () => {
        const request = createServer();
        const res = await request("/about", "__wb_preview=1");

        expect(res.status).toBe(307);
        expect(res.headers.get("location")).toBe("/about");
        expect(res.headers.get("set-cookie")).toContain("__wb_preview=;");
    });

    it("sets the A/B visitor cookie and the default tenant on live requests", async () => {
        const request = createServer();
        const res = await request("/about");

        expect(res.status).toBe(200);
        expect(res.headers.get("set-cookie")).toMatch(/^wb_ab_vid=[0-9a-f-]{36};/);
        expect(await res.json()).toEqual({ tenantId: "root" });

        const returning = await request("/about", "wb_ab_vid=existing");
        expect(returning.headers.get("set-cookie")).toBeNull();
    });

    it("leaves Nuxt internals and files alone", async () => {
        const request = createServer();
        const res = await request("/_nuxt/entry.js?wb.preview=true");

        expect(res.status).toBe(200);
        expect(await res.json()).toEqual({ tenantId: null });
    });
});

describe("custom preview route", () => {
    it("lets the preview route through instead of redirecting it to itself", async () => {
        const request = createServer({ previewRoute: "/preview" });

        const page = await request("/about?wb.preview=true&wb.path=/about");
        expect(page.headers.get("location")).toBe("/preview?wb.preview=true&wb.path=%2Fabout");

        const preview = await request("/preview?wb.preview=true&wb.path=/about");
        expect(preview.status).toBe(307);
        expect(preview.headers.get("location")).toBe("/about?wb.preview=true&wb.path=%2Fabout");
        expect(preview.headers.get("set-cookie")).toContain("__wb_preview=1");
    });
});

describe("createPreviewHandler", () => {
    it("sets the preview cookie and redirects to wb.path", async () => {
        const request = createServer();
        const res = await request("/api/preview?wb.preview=true&wb.path=/about");

        expect(res.status).toBe(307);
        expect(res.headers.get("location")).toBe("/about?wb.preview=true&wb.path=%2Fabout");
        expect(res.headers.get("set-cookie")).toContain("__wb_preview=1");
        expect(res.headers.get("set-cookie")).toContain("SameSite=None");
    });

    it("does not redirect to another origin", async () => {
        const request = createServer();

        const paths = [
            "//evil.test",
            "/\\evil.test",
            "https://evil.test",
            "/\t/evil.test",
            "/\n/evil.test"
        ];
        for (const path of paths) {
            const res = await request(
                `/api/preview?wb.preview=true&wb.path=${encodeURIComponent(path)}`
            );
            expect(res.headers.get("location")).toMatch(/^\/\?/);
        }
    });
});
