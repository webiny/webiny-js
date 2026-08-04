import { describe, it, expect, vi, afterEach } from "vitest";
import * as React from "react";
import { renderToString } from "react-dom/server";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
    bundleComponent,
    bundleComponents,
    validateComponentSource
} from "../src/api/bundler/index.js";
import { RemoteComponentLoader } from "@webiny/sdk-nextjs/remote-components/RemoteComponentLoader.js";
import type { RemoteComponentManifest } from "@webiny/sdk-nextjs/remote-components/types.js";

const BANNER_SOURCE = `
export default function Banner({ inputs: { headline, ctaLabel } }) {
    return (
        <div data-testid="banner">
            <h2>{headline}</h2>
            {ctaLabel && <button>{ctaLabel}</button>}
        </div>
    );
}

export const manifest = {
    name: "Test/Banner",
    label: "Banner",
    inputs: [
        { name: "headline", factory: "createTextInput", params: { label: "Headline" } },
        { name: "ctaLabel", factory: "createTextInput", params: { label: "CTA Label" } }
    ]
};
`;

const HERO_SOURCE = `
export default function Hero({ inputs: { title } }) {
    return (
        <section data-testid="hero">
            <h1>{title}</h1>
        </section>
    );
}

export const manifest = {
    name: "Test/Hero",
    label: "Hero",
    inputs: [
        { name: "title", factory: "createTextInput", params: { label: "Title" } }
    ]
};
`;

describe("bundleComponent", () => {
    it("should bundle a JSX component source into a valid .mjs", async () => {
        const result = await bundleComponent({
            name: "Test/Banner",
            source: BANNER_SOURCE
        });

        expect(result.name).toBe("Test/Banner");
        expect(result.bundled).toContain("createComponent");
        expect(result.sha256).toBeTruthy();
        expect(result.bundled).not.toContain("import ");
    });

    it("should bundle multiple components independently", async () => {
        const results = await bundleComponents([
            { name: "Test/Banner", source: BANNER_SOURCE },
            { name: "Test/Hero", source: HERO_SOURCE }
        ]);

        expect(results).toHaveLength(2);
        expect(results[0].name).toBe("Test/Banner");
        expect(results[1].name).toBe("Test/Hero");
        expect(results[0].sha256).not.toBe(results[1].sha256);
    });

    it("should bundle component with CSS from the css field", async () => {
        const result = await bundleComponent({
            name: "Test/Card",
            source: `
export default function Card({ inputs: { title } }) {
    return (
        <div className="card">
            <h3 className="card-title">{title}</h3>
        </div>
    );
}

export const manifest = {
    name: "Test/Card",
    label: "Card",
    inputs: [
        { name: "title", factory: "createTextInput", params: { label: "Title" } }
    ]
};
`,
            css: `.card { padding: 16px; border: 1px solid #ccc; }
.card-title { font-size: 1.5rem; }`
        });

        expect(result.css).toBeDefined();
        expect(result.cssSha256).toBeDefined();
        expect(result.css).toContain(".rc-test-card .card");
        expect(result.css).toContain(".rc-test-card .card-title");
        expect(result.css).toContain("padding: 16px");
    });

    it("should return no CSS when none is provided", async () => {
        const result = await bundleComponent({
            name: "Test/Banner",
            source: BANNER_SOURCE
        });

        expect(result.css).toBeUndefined();
        expect(result.cssSha256).toBeUndefined();
    });

    it("should reject invalid source (has imports)", async () => {
        const invalidSource = `
import React from "react";

export default function Bad() {
    return <div>bad</div>;
}

export const manifest = {
    name: "Bad",
    label: "Bad",
    inputs: []
};
`;
        await expect(bundleComponent({ name: "Bad", source: invalidSource })).rejects.toThrow(
            "import statements"
        );
    });
});

describe("validateComponentSource", () => {
    it("should accept valid component source", () => {
        const result = validateComponentSource(BANNER_SOURCE);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
    });

    it("should reject source with import statements", () => {
        const result = validateComponentSource(`
import React from "react";
export default function X() { return null; }
export const manifest = { name: "X", inputs: [] };
`);
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.includes("import"))).toBe(true);
    });

    it("should reject source without default export", () => {
        const result = validateComponentSource(`
export function X() { return null; }
export const manifest = { name: "X", inputs: [] };
`);
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.includes("default export"))).toBe(true);
    });

    it("should reject source without manifest export", () => {
        const result = validateComponentSource(`
export default function X() { return null; }
`);
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.includes("manifest"))).toBe(true);
    });
});

describe("bundleComponent → RemoteComponentLoader integration", () => {
    let cacheDir: string;

    afterEach(async () => {
        vi.restoreAllMocks();
        if (cacheDir) {
            await fs.rm(cacheDir, { recursive: true, force: true });
        }
    });

    it("should produce a bundle that RemoteComponentLoader can load and render", async () => {
        cacheDir = path.join(os.tmpdir(), `webiny-bundler-test-${Date.now()}`);

        const bundled = await bundleComponent({
            name: "Test/Banner",
            source: BANNER_SOURCE
        });

        const bundleBytes = Buffer.from(bundled.bundled, "utf-8");
        const manifestUrl = "https://cdn.test/manifest.json";
        const bannerUrl = "https://cdn.test/banner.mjs";

        const manifest: RemoteComponentManifest = {
            schemaVersion: "1",
            packageId: "test-pkg",
            version: "v001",
            sdkVersion: "1",
            createdAt: "2026-07-24T00:00:00.000Z",
            components: [
                {
                    name: "Test/Banner",
                    server: {
                        url: bannerUrl,
                        sha256: bundled.sha256,
                        size: bundleBytes.length,
                        contentType: "text/javascript"
                    }
                }
            ]
        };

        vi.spyOn(global, "fetch").mockImplementation(async input => {
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

        const components = await loader.loadComponents(manifestUrl);

        expect(components).toHaveLength(1);
        expect(components[0].manifest.name).toBe("Test/Banner");

        const BannerComponent = components[0].component as React.ComponentType<any>;
        const html = renderToString(
            React.createElement(BannerComponent, {
                inputs: { headline: "Bundled and loaded!", ctaLabel: "Click me" },
                styles: {},
                element: { id: "test" },
                breakpoint: "desktop"
            })
        );

        expect(html).toContain("Bundled and loaded!");
        expect(html).toContain("Click me");
        expect(html).toContain('data-testid="banner"');
    });
});
