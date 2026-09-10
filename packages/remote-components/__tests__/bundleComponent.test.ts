import { describe, it, expect } from "vitest";
import * as React from "react";
import * as sdkNextjs from "@webiny/sdk-nextjs";
import { renderToString } from "react-dom/server";
import {
    bundleComponent,
    bundleComponents,
    validateComponentSource
} from "../src/api/bundler/index.js";

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

describe("bundleComponent → eval integration", () => {
    it("should produce a bundle that can be eval'd and rendered", async () => {
        const bundled = await bundleComponent({
            name: "Test/Banner",
            source: BANNER_SOURCE
        });

        const fn = new Function(
            `var __remoteComponent__; ${bundled.bundled}; return __remoteComponent__;`
        );
        const mod = fn();

        const sdk = {
            version: "1" as const,
            dependencies: { sdk: sdkNextjs, React },
            environment: { tenantId: "test-tenant", locale: "en-US", mode: "server" as const }
        };

        const result = mod.createComponent(sdk);
        expect(result).toBeDefined();
        expect(result.manifest).toBeDefined();
        expect(result.manifest.name).toBe("Test/Banner");

        const BannerComponent = result.component as React.ComponentType<any>;
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
