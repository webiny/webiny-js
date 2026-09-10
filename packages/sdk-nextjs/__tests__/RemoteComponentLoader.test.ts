import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as React from "react";
import { renderToString } from "react-dom/server";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { RemoteComponentLoader } from "../src/remote-components/RemoteComponentLoader.js";
import type { RemoteComponentManifest } from "../src/remote-components/types.js";

function createBannerBundleSource() {
    return `
export function createComponent(runtime) {
    const { React, sdk } = runtime.dependencies;
    const { createComponent: _createComponent, createTextInput } = sdk;

    function Banner(props) {
        return React.createElement("div", { "data-testid": "banner" },
            React.createElement("h2", null, props.inputs.headline)
        );
    }

    return _createComponent(Banner, {
        name: "Test/Banner",
        label: "Banner",
        inputs: [
            createTextInput({ name: "headline", label: "Headline", defaultValue: "Hello" })
        ]
    });
}
`;
}

function createManifest(
    componentBundles: Array<{ name: string; url: string; bytes: Buffer }>
): RemoteComponentManifest {
    return {
        schemaVersion: "1",
        packageId: "test-components",
        version: "v001",
        sdkVersion: "1",
        createdAt: "2026-07-24T00:00:00.000Z",
        components: componentBundles.map(bundle => ({
            name: bundle.name,
            server: {
                url: bundle.url,
                sha256: createHash("sha256").update(bundle.bytes).digest("hex"),
                size: bundle.bytes.length,
                contentType: "text/javascript"
            }
        }))
    };
}

describe("RemoteComponentLoader", () => {
    let cacheDir: string;

    beforeEach(async () => {
        cacheDir = path.join(os.tmpdir(), `webiny-test-remote-${Date.now()}`);
    });

    afterEach(async () => {
        vi.restoreAllMocks();
        await fs.rm(cacheDir, { recursive: true, force: true });
    });

    it("should load a per-component bundle and return Component[]", async () => {
        const bundleSource = createBannerBundleSource();
        const bundleBytes = Buffer.from(bundleSource, "utf-8");
        const manifestUrl = "https://cdn.test/manifest.json";
        const bannerUrl = "https://cdn.test/banner.mjs";
        const manifest = createManifest([
            { name: "Test/Banner", url: bannerUrl, bytes: bundleBytes }
        ]);

        const fetchSpy = vi.spyOn(global, "fetch").mockImplementation(async input => {
            const url = typeof input === "string" ? input : input.toString();

            if (url === manifestUrl) {
                return new Response(JSON.stringify(manifest), {
                    status: 200,
                    headers: { "Content-Type": "application/json" }
                });
            }

            if (url === bannerUrl) {
                return new Response(bundleBytes, {
                    status: 200,
                    headers: { "Content-Type": "text/javascript" }
                });
            }

            return new Response("Not found", { status: 404 });
        });

        const loader = new RemoteComponentLoader({
            cacheDirectory: cacheDir,
            environment: { tenantId: "test-tenant", locale: "en-US" }
        });

        const components = await loader.loadComponents(manifestUrl);

        expect(components).toHaveLength(1);
        expect(components[0].manifest.name).toBe("Test/Banner");
        expect(fetchSpy).toHaveBeenCalledTimes(2);

        const BannerComponent = components[0].component as React.ComponentType<any>;
        const html = renderToString(
            React.createElement(BannerComponent, {
                inputs: { headline: "Hello from remote!" },
                styles: {},
                element: { id: "test" },
                breakpoint: "desktop"
            })
        );

        expect(html).toContain("Hello from remote!");
        expect(html).toContain('data-testid="banner"');
    });

    it("should load multiple per-component bundles", async () => {
        const bannerSource = createBannerBundleSource();
        const bannerBytes = Buffer.from(bannerSource, "utf-8");

        const heroSource = `
export function createComponent(runtime) {
    const { React, sdk } = runtime.dependencies;
    const { createComponent: _createComponent, createTextInput } = sdk;

    function Hero(props) {
        return React.createElement("section", { "data-testid": "hero" },
            React.createElement("h1", null, props.inputs.title)
        );
    }

    return _createComponent(Hero, {
        name: "Test/Hero",
        label: "Hero",
        inputs: [
            createTextInput({ name: "title", label: "Title" })
        ]
    });
}
`;
        const heroBytes = Buffer.from(heroSource, "utf-8");

        const manifestUrl = "https://cdn.test/manifest.json";
        const bannerUrl = "https://cdn.test/banner.mjs";
        const heroUrl = "https://cdn.test/hero.mjs";

        const manifest = createManifest([
            { name: "Test/Banner", url: bannerUrl, bytes: bannerBytes },
            { name: "Test/Hero", url: heroUrl, bytes: heroBytes }
        ]);

        vi.spyOn(global, "fetch").mockImplementation(async input => {
            const url = typeof input === "string" ? input : input.toString();
            const responses: Record<string, Response> = {
                [manifestUrl]: new Response(JSON.stringify(manifest), { status: 200 }),
                [bannerUrl]: new Response(bannerBytes, { status: 200 }),
                [heroUrl]: new Response(heroBytes, { status: 200 })
            };
            return responses[url] ?? new Response("Not found", { status: 404 });
        });

        const loader = new RemoteComponentLoader({
            cacheDirectory: cacheDir,
            environment: { tenantId: "test-tenant", locale: "en-US" }
        });

        const components = await loader.loadComponents(manifestUrl);

        expect(components).toHaveLength(2);
        expect(components[0].manifest.name).toBe("Test/Banner");
        expect(components[1].manifest.name).toBe("Test/Hero");
    });

    it("should cache loaded components on second call", async () => {
        const bundleBytes = Buffer.from(createBannerBundleSource(), "utf-8");
        const manifestUrl = "https://cdn.test/manifest.json";
        const bannerUrl = "https://cdn.test/banner.mjs";
        const manifest = createManifest([
            { name: "Test/Banner", url: bannerUrl, bytes: bundleBytes }
        ]);

        const fetchSpy = vi.spyOn(global, "fetch").mockImplementation(async input => {
            const url = typeof input === "string" ? input : input.toString();
            if (url === manifestUrl) {
                return new Response(JSON.stringify(manifest), { status: 200 });
            }
            if (url === bannerUrl) {
                return new Response(bundleBytes, { status: 200 });
            }
            return new Response("Not found", { status: 404 });
        });

        const loader = new RemoteComponentLoader({
            cacheDirectory: cacheDir,
            environment: { tenantId: "test-tenant", locale: "en-US" }
        });

        const first = await loader.loadComponents(manifestUrl);
        const second = await loader.loadComponents(manifestUrl);

        expect(first).toBe(second);
        expect(fetchSpy).toHaveBeenCalledTimes(2);
    });

    it("should reject bundles with hash mismatch", async () => {
        const corruptedBytes = Buffer.from("corrupted content", "utf-8");
        const originalBytes = Buffer.from("original", "utf-8");
        const manifestUrl = "https://cdn.test/manifest.json";
        const bannerUrl = "https://cdn.test/banner.mjs";
        const manifest = createManifest([
            { name: "Test/Banner", url: bannerUrl, bytes: originalBytes }
        ]);

        vi.spyOn(global, "fetch").mockImplementation(async input => {
            const url = typeof input === "string" ? input : input.toString();
            if (url === manifestUrl) {
                return new Response(JSON.stringify(manifest), { status: 200 });
            }
            if (url === bannerUrl) {
                return new Response(corruptedBytes, { status: 200 });
            }
            return new Response("Not found", { status: 404 });
        });

        const loader = new RemoteComponentLoader({
            cacheDirectory: cacheDir,
            environment: { tenantId: "test-tenant", locale: "en-US" }
        });

        await expect(loader.loadComponents(manifestUrl)).rejects.toThrow("hash mismatch");
    });

    it("should reject bundles exceeding size limit", async () => {
        const largeBundle = Buffer.alloc(100);
        const manifestUrl = "https://cdn.test/manifest.json";
        const bannerUrl = "https://cdn.test/banner.mjs";
        const manifest = createManifest([
            { name: "Test/Banner", url: bannerUrl, bytes: largeBundle }
        ]);

        vi.spyOn(global, "fetch").mockImplementation(async input => {
            const url = typeof input === "string" ? input : input.toString();
            if (url === manifestUrl) {
                return new Response(JSON.stringify(manifest), { status: 200 });
            }
            if (url === bannerUrl) {
                return new Response(largeBundle, {
                    status: 200,
                    headers: { "Content-Length": "100" }
                });
            }
            return new Response("Not found", { status: 404 });
        });

        const loader = new RemoteComponentLoader({
            cacheDirectory: cacheDir,
            maximumServerBundleBytes: 50,
            environment: { tenantId: "test-tenant", locale: "en-US" }
        });

        await expect(loader.loadComponents(manifestUrl)).rejects.toThrow("exceeds size limit");
    });

    it("should reject manifests with unsupported SDK version", async () => {
        const bundleBytes = Buffer.from(createBannerBundleSource(), "utf-8");
        const manifestUrl = "https://cdn.test/manifest.json";
        const manifest = createManifest([
            { name: "Test/Banner", url: "https://cdn.test/banner.mjs", bytes: bundleBytes }
        ]);
        manifest.sdkVersion = "99";

        vi.spyOn(global, "fetch").mockImplementation(async input => {
            const url = typeof input === "string" ? input : input.toString();
            if (url === manifestUrl) {
                return new Response(JSON.stringify(manifest), { status: 200 });
            }
            return new Response("Not found", { status: 404 });
        });

        const loader = new RemoteComponentLoader({
            cacheDirectory: cacheDir,
            environment: { tenantId: "test-tenant", locale: "en-US" }
        });

        await expect(loader.loadComponents(manifestUrl)).rejects.toThrow("SDK version mismatch");
    });

    it("should reject manifest fetch failures", async () => {
        vi.spyOn(global, "fetch").mockImplementation(async () => {
            return new Response("Server Error", { status: 500 });
        });

        const loader = new RemoteComponentLoader({
            cacheDirectory: cacheDir,
            environment: { tenantId: "test-tenant", locale: "en-US" }
        });

        await expect(loader.loadComponents("https://cdn.test/manifest.json")).rejects.toThrow(
            "Failed to fetch manifest"
        );
    });
});
