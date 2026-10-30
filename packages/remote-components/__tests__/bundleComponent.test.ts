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

const CARD_SOURCE = `
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
`;

/**
 * A copy of the regex the server bundler used before it parsed CSS with css-tree.
 * Used to prove that CSS without at-rules is scoped exactly as before.
 */
function scopeCssWithOldRegex(css: string, scope: string): string {
    return css.replace(/(^|\})\s*([^@{}][^{]*)\{/g, (match, prefix, selector) => {
        const trimmed = selector.trim();
        if (trimmed.startsWith(":root") || trimmed.startsWith("@")) {
            return match;
        }
        const scopedSelectors = trimmed
            .split(",")
            .map((s: string) => `.${scope} ${s.trim()}`)
            .join(", ");
        return `${prefix}${scopedSelectors}{`;
    });
}

async function bundleCss(css: string): Promise<string | undefined> {
    const result = await bundleComponent({ name: "Test/Card", source: CARD_SOURCE, css });
    return result.css;
}

describe("bundleComponent CSS scoping", () => {
    it("should scope the first rule inside a @media block", async () => {
        const css = await bundleCss(
            "@media (max-width:600px){.card{padding:16px}.card-title{font-size:20px}}"
        );

        expect(css).toBe(
            "@media (max-width:600px){.rc-test-card .card{padding:16px}.rc-test-card .card-title{font-size:20px}}"
        );
    });

    it("should scope a @media block with a single rule", async () => {
        const css = await bundleCss("@media (max-width:600px){h1{font-size:20px}}");

        expect(css).toBe("@media (max-width:600px){.rc-test-card h1{font-size:20px}}");
    });

    it("should scope rules in @supports nested inside @media", async () => {
        const css = await bundleCss(
            "@media (min-width:600px){@supports (display:grid){.card{display:grid}}}"
        );

        expect(css).toBe(
            "@media (min-width:600px){@supports (display:grid){.rc-test-card .card{display:grid}}}"
        );
    });

    it("should scope the rule after a formatted @media block", async () => {
        const css = await bundleCss(`@media (max-width: 600px) {
    .card { padding: 8px; }
}
.card-title { font-size: 1.5rem; }`);

        expect(css).toBe(`@media (max-width: 600px) {.rc-test-card .card{ padding: 8px; }
}.rc-test-card .card-title{ font-size: 1.5rem; }`);
    });

    it("should not scope keyframe selectors", async () => {
        const input = "@keyframes fade{from{opacity:0}to{opacity:1}}.card{animation:fade 1s}";
        const css = await bundleCss(input);

        expect(css).toBe(
            "@keyframes fade{from{opacity:0}to{opacity:1}}.rc-test-card .card{animation:fade 1s}"
        );
    });

    it("should not scope nested rules a second time", async () => {
        const css = await bundleCss(
            ".card { color: red; &:hover { color: blue } @media (x) { & .card-title { color: green } } }"
        );

        expect(css).toBe(
            ".rc-test-card .card{ color: red; &:hover { color: blue } @media (x) { & .card-title { color: green } } }"
        );
    });

    it("should scope a @media block from the @css block in the source", async () => {
        const result = await bundleComponent({
            name: "Test/Card",
            source: `
const styles = \`/* @css */
@media (max-width:600px){.card{padding:16px}}
/* @end-css */\`;
${CARD_SOURCE}`
        });

        expect(result.css).toBe("@media (max-width:600px){.rc-test-card .card{padding:16px}}");
    });

    it.each([
        [
            "the css field fixture",
            `.card { padding: 16px; border: 1px solid #ccc; }
.card-title { font-size: 1.5rem; }`
        ],
        ["a selector list", "h1, .card > p { margin: 0; }\n.card-title{color:red}"],
        ["a :root rule", ":root { --gap: 8px; }\n.card { gap: var(--gap); }"],
        ["comments in selectors", ".card /* keep */ { color: red; }\n.a /* x */, .b{x:1}"]
    ])("should scope %s without at-rules exactly as before", async (_, input) => {
        const css = await bundleCss(input);

        expect(css).toBe(scopeCssWithOldRegex(input, "rc-test-card"));
    });

    it("should fall back to the previous scoping when the CSS can't be parsed", async () => {
        const input = ".card { color: red; } .card-title { .nested { color: blue; } }";
        const result = await bundleComponent({
            name: "Test/Card",
            source: CARD_SOURCE,
            css: input
        });

        expect(result.bundled).toContain("createComponent");
        expect(result.css).toBe(scopeCssWithOldRegex(input, "rc-test-card"));
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
