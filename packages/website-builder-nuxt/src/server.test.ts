import { describe, it, expect } from "vitest";
import { createApp, eventHandler, toWebHandler } from "h3";
import { createPreviewHandler, createWebsiteBuilderMiddleware } from "./server.js";

const createServer = () => {
    const app = createApp();
    app.use("/api/preview", eventHandler(createPreviewHandler()));
    app.use(eventHandler(createWebsiteBuilderMiddleware()));
    app.use(eventHandler(event => ({ tenantId: event.context.tenantId ?? null })));
    const handler = toWebHandler(app);

    return (path: string, cookie?: string) => {
        return handler(
            new Request(`http://localhost${path}`, {
                headers: cookie ? { cookie } : {},
                redirect: "manual"
            })
        );
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

        for (const path of ["//evil.test", "/\\evil.test", "https://evil.test"]) {
            const res = await request(
                `/api/preview?wb.preview=true&wb.path=${encodeURIComponent(path)}`
            );
            expect(res.headers.get("location")).toMatch(/^\/\?/);
        }
    });
});
