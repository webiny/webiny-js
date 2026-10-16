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

describe("bundleComponent → nested input descriptors", () => {
    const loadManifest = async (name: string, source: string) => {
        const bundled = await bundleComponent({ name, source });
        const fn = new Function(
            `var __remoteComponent__; ${bundled.bundled}; return __remoteComponent__;`
        );
        const mod = fn();
        return mod.createComponent({
            version: "1" as const,
            dependencies: { sdk: sdkNextjs, React },
            environment: { tenantId: "test-tenant", locale: "en-US", mode: "server" as const }
        });
    };

    it("should build a list-of-cards object input whose params contain nested fields", async () => {
        const result = await loadManifest(
            "Custom/CardGrid",
            `
export default function CardGrid({ inputs: { cards } }) {
    return (
        <div data-testid="card-grid">
            {(cards || []).map((card, index) => (
                <div key={index}>{card.title}: {card.description}</div>
            ))}
        </div>
    );
}

export const manifest = {
    name: "Custom/CardGrid",
    inputs: [
        { name: "cards", factory: "createObjectInput", params: { list: true, label: "Cards", fields: [
            { name: "title", factory: "createTextInput", params: { label: "Title", defaultValue: "Feature" } },
            { name: "description", factory: "createLongTextInput", params: { label: "Description", defaultValue: "Description text." } }
        ] } }
    ],
    defaults: {
        inputs: {
            cards: [
                { title: "Fast Performance", description: "Lightning-fast load times." }
            ]
        }
    }
};
`
        );

        const [cards] = result.manifest.inputs;
        expect(cards.name).toBe("cards");
        expect(cards.type).toBe("object");
        expect(cards.renderer).toBe("Webiny/Object");
        expect(cards.list).toBe(true);
        expect(cards.label).toBe("Cards");
        expect(cards).not.toHaveProperty("factory");
        expect(cards).not.toHaveProperty("params");

        expect(cards.fields).toHaveLength(2);
        expect(cards.fields[0]).toMatchObject({
            name: "title",
            type: "text",
            label: "Title",
            defaultValue: "Feature"
        });
        expect(cards.fields[1]).toMatchObject({
            name: "description",
            type: "longText",
            label: "Description"
        });

        expect(result.manifest.defaults).toEqual({
            inputs: {
                cards: [{ title: "Fast Performance", description: "Lightning-fast load times." }]
            }
        });
    });

    it("should build object inputs nested more than one level deep", async () => {
        const result = await loadManifest(
            "Custom/Testimonial",
            `
export default function Testimonial({ inputs: { author } }) {
    return <blockquote>{author && author.name}</blockquote>;
}

export const manifest = {
    name: "Custom/Testimonial",
    inputs: [
        { name: "author", factory: "createObjectInput", params: { label: "Author", fields: [
            { name: "name", factory: "createTextInput", params: { label: "Name" } },
            { name: "link", factory: "createObjectInput", params: { label: "Link", fields: [
                { name: "href", factory: "createTextInput", params: { label: "URL" } },
                { name: "openInNewTab", factory: "createBooleanInput", params: { label: "New tab" } }
            ] } }
        ] } }
    ]
};
`
        );

        const [author] = result.manifest.inputs;
        expect(author).toMatchObject({ name: "author", type: "object" });
        expect(author.fields[0]).toMatchObject({ name: "name", type: "text" });

        const link = author.fields[1];
        expect(link).toMatchObject({ name: "link", type: "object", label: "Link" });
        expect(link.fields).toHaveLength(2);
        expect(link.fields[0]).toMatchObject({ name: "href", type: "text", label: "URL" });
        expect(link.fields[1]).toMatchObject({ name: "openInNewTab", type: "boolean" });
    });

    it("should build inputs whose params contain arrays of plain objects", async () => {
        const result = await loadManifest(
            "Custom/Sized",
            `
export default function Sized({ inputs: { size, title } }) {
    return <div className={size}>{title}</div>;
}

export const manifest = {
    name: "Custom/Sized",
    inputs: [
        { name: "size", factory: "createSelectInput", params: { label: "Size", defaultValue: "md", options: [
            { label: "Small", value: "sm" },
            { label: "Medium", value: "md" }
        ] } },
        { name: "title", factory: "createTextInput", params: { label: "Title" } }
    ]
};
`
        );

        const [size, title] = result.manifest.inputs;
        expect(size).toMatchObject({ name: "size", type: "select", defaultValue: "md" });
        expect(size.options).toEqual([
            { label: "Small", value: "sm" },
            { label: "Medium", value: "md" }
        ]);
        expect(title).toMatchObject({ name: "title", type: "text", label: "Title" });
    });

    it("should keep building flat inputs and inputs with empty params", async () => {
        const result = await loadManifest(
            "Custom/Flat",
            `
export default function Flat({ inputs: { heading, visible } }) {
    return visible ? <h2>{heading}</h2> : null;
}

export const manifest = {
    name: "Custom/Flat",
    inputs: [
        { name: "heading", factory: "createTextInput", params: { label: "Heading" } },
        { name: "visible", factory: "createBooleanInput", params: {} }
    ]
};
`
        );

        expect(result.manifest.inputs).toHaveLength(2);
        expect(result.manifest.inputs[0]).toMatchObject({
            name: "heading",
            type: "text",
            label: "Heading"
        });
        expect(result.manifest.inputs[1]).toMatchObject({ name: "visible", type: "boolean" });
    });
});
