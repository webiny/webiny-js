import { describe, it, expect } from "vitest";
import {
    bundleComponent,
    renderComponentMarkup,
    validateComponentBundle
} from "~/api/bundler/index.js";
import { referenceBundleComponent } from "./reference/referenceBundleComponent.js";

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

const HELPER_SOURCE = `
const clamp = n => Math.max(0, n);

function Badge({ children }) {
    return <span className="badge">{children}</span>;
}

export default function Counter({ inputs: { count } }) {
    return <Badge>{clamp(count)}</Badge>;
}

export const manifest = {
    name: "Test/Counter",
    label: "Counter",
    inputs: [
        { name: "count", factory: "createNumberInput", params: { label: "Count" } }
    ]
};
`;

const NESTED_SOURCE = `
export default function Profile({ inputs: { person } }) {
    return (
        <div>
            <h2>{person.name}</h2>
            <img src={person.photo.url} alt={person.name} />
        </div>
    );
}

export const manifest = {
    name: "Test/Profile",
    label: "Profile",
    inputs: [
        {
            name: "person",
            factory: "createObjectInput",
            params: {
                label: "Person",
                fields: [
                    { name: "name", factory: "createTextInput", params: { label: "Name" } },
                    { name: "photo", factory: "createFileInput", params: { label: "Photo" } }
                ]
            }
        }
    ]
};
`;

const CARD_CSS = [
    `.card { padding: 16px; border: 1px solid #ccc; }
.card-title { font-size: 1.5rem; }`,
    "@media (max-width:600px){.card{padding:16px}.card-title{font-size:20px}}",
    "@media (min-width:600px){@supports (display:grid){.card{display:grid}}}",
    "@keyframes fade{from{opacity:0}to{opacity:1}}.card{animation:fade 1s}",
    ".card { color: red; &:hover { color: blue } }",
    "h1, .card > p { margin: 0; }\n.card-title{color:red}",
    ":root { --gap: 8px; }\n.card { gap: var(--gap); }",
    ".card { color: red; } .card-title { .nested { color: blue; } }"
];

describe("bundleComponent library", () => {
    it.each([
        ["Test/Banner", BANNER_SOURCE, undefined],
        ["Test/Hero", HERO_SOURCE, undefined],
        ["Test/Counter", HELPER_SOURCE, undefined],
        ...CARD_CSS.map(css => ["Test/Card", CARD_SOURCE, css] as const)
    ])("produces the previous server bundler's output for %s", async (name, source, css) => {
        const component = { name, source, css };
        const result = await bundleComponent(component);
        const reference = await referenceBundleComponent(component);

        expect(result.bundled).toBe(reference.bundled);
        expect(result.sha256).toBe(reference.sha256);
        expect(result.css).toBe(reference.css);
        expect(result.cssSha256).toBe(reference.cssSha256);
    });

    it("keeps module-level helpers in the bundle", async () => {
        const result = await bundleComponent({ name: "Test/Counter", source: HELPER_SOURCE });
        const { markup } = await renderComponentMarkup(result.bundled, "Test/Counter", [
            { name: "count", observedValues: ["-3"] }
        ]);

        expect(markup).toBe('<span class="badge">0</span>');
    });

    it("bundles a nested object input", async () => {
        const result = await bundleComponent({ name: "Test/Profile", source: NESTED_SOURCE });
        const manifest = JSON.parse(result.manifest);

        expect(manifest.inputs).toEqual([
            expect.objectContaining({
                name: "person",
                type: "object",
                fields: [
                    expect.objectContaining({ name: "name", type: "text" }),
                    expect.objectContaining({ name: "photo", type: "file" })
                ]
            })
        ]);
    });

    it("returns the manifest the bundle produces, named after the component", async () => {
        const result = await bundleComponent({ name: "Custom/Banner", source: BANNER_SOURCE });
        const manifest = JSON.parse(result.manifest);

        expect(manifest.name).toBe("Custom/Banner");
        expect(manifest.label).toBe("Banner");
        expect(manifest.inputs.map((input: { name: string }) => input.name)).toEqual([
            "headline",
            "ctaLabel"
        ]);
    });
});

describe("renderComponentMarkup", () => {
    it("renders with the component's defaults and the given values", async () => {
        const result = await bundleComponent({ name: "Test/Banner", source: BANNER_SOURCE });
        const rendered = await renderComponentMarkup(result.bundled, "Test/Banner", [
            { name: "headline", observedValues: ["Hello"] }
        ]);

        expect(rendered.text).toBe("Hello");
        expect(rendered.markup).toContain("<h2>Hello</h2>");
    });

    it("decodes numeric references as code points", async () => {
        const source = BANNER_SOURCE.replace(
            "<h2>{headline}</h2>",
            '<h2 dangerouslySetInnerHTML={{ __html: "&#128512; &#x1F600; &#65; &#xD800; &#1114112;" }} />'
        );
        const result = await bundleComponent({ name: "Test/Banner", source });
        const rendered = await renderComponentMarkup(result.bundled, "Test/Banner", []);

        expect(rendered.text).toBe("\u{1F600} \u{1F600} A \uFFFD \uFFFD");
    });

    it("decodes each entity once, so escaped entities stay text", async () => {
        const result = await bundleComponent({ name: "Test/Banner", source: BANNER_SOURCE });
        const rendered = await renderComponentMarkup(result.bundled, "Test/Banner", [
            { name: "headline", observedValues: ['&lt; &amp; <b> "x"'] }
        ]);

        expect(rendered.markup).toContain("<h2>&amp;lt; &amp;amp; &lt;b&gt; &quot;x&quot;</h2>");
        expect(rendered.text).toBe('&lt; &amp; <b> "x"');
    });

    it("shows a file input's object used where its URL belongs", async () => {
        const source = NESTED_SOURCE.replace("person.photo.url", "person.photo").replace(
            '    label: "Profile",',
            '    label: "Profile",\n    defaults: { inputs: { person: { photo: { url: "https://cdn/a.png" } } } },'
        );
        const result = await bundleComponent({ name: "Test/Profile", source });
        const { markup, files } = await renderComponentMarkup(result.bundled, "Test/Profile", [
            { name: "person", fields: [{ name: "name", observedValues: ["Ada"] }] }
        ]);

        expect(markup).toContain("<h2>Ada</h2>");
        expect(markup).toContain('src="[object Object]"');
        expect(files).toEqual([{ path: "person.photo", urls: ["https://cdn/a.png"], list: false }]);
    });

    it("reports a bundle that can't render", async () => {
        await expect(
            renderComponentMarkup("throw new Error('boom')", "Broken", [])
        ).rejects.toThrow('Could not render "Broken": boom');
    });
});

describe("validateComponentBundle", () => {
    const card = { name: "Test/Card", source: CARD_SOURCE, css: CARD_CSS[0] };

    const bundleOf = async (component: { name: string; source: string; css?: string }) => {
        const result = await bundleComponent(component);
        return { bundledJs: result.bundled, bundledCss: result.css, manifest: result.manifest };
    };

    it("accepts the bundle the library produced", async () => {
        const bundle = await bundleOf(card);

        expect(await validateComponentBundle(card, bundle)).toEqual({ valid: true, errors: [] });
    });

    it("accepts a manifest serialized with a different key order", async () => {
        const bundle = await bundleOf(card);
        const manifest = JSON.parse(bundle.manifest);
        const reordered = Object.fromEntries(Object.entries(manifest).reverse());

        const result = await validateComponentBundle(card, {
            ...bundle,
            manifest: JSON.stringify(reordered)
        });

        expect(result.valid).toBe(true);
    });

    it("rejects a manifest the bundle doesn't produce", async () => {
        const bundle = await bundleOf(card);
        const manifest = { ...JSON.parse(bundle.manifest), label: "Something else" };

        const result = await validateComponentBundle(card, {
            ...bundle,
            manifest: JSON.stringify(manifest)
        });

        expect(result.valid).toBe(false);
        expect(result.errors).toEqual([
            "The bundle's `manifest` is not the manifest `bundledJs` produces."
        ]);
    });

    it("rejects a bundle built from a source with other inputs", async () => {
        const other = await bundleOf({
            name: "Test/Card",
            source: BANNER_SOURCE,
            css: CARD_CSS[0]
        });

        const result = await validateComponentBundle(card, other);

        expect(result.valid).toBe(false);
        expect(result.errors).toEqual([
            "The bundle's manifest does not declare the inputs the source declares."
        ]);
    });

    it("rejects a manifest that isn't JSON", async () => {
        const bundle = await bundleOf(card);

        const result = await validateComponentBundle(card, { ...bundle, manifest: "{" });

        expect(result.errors).toContain("The bundle's `manifest` is not valid JSON.");
    });

    it("rejects CSS that isn't scoped to the component", async () => {
        const bundle = await bundleOf(card);

        const result = await validateComponentBundle(card, { ...bundle, bundledCss: CARD_CSS[0] });

        expect(result.errors).toEqual([
            "The bundle's CSS is not the component's CSS, scoped to its scope class."
        ]);
    });

    it("rejects scoped CSS with an unscoped rule added", async () => {
        const bundle = await bundleOf(card);
        const bundledCss = `${bundle.bundledCss}\nbody { margin: 0; }`;

        const result = await validateComponentBundle(card, { ...bundle, bundledCss });

        expect(result.errors).toEqual([
            "The bundle's CSS is not the component's CSS, scoped to its scope class."
        ]);
    });

    it("rejects CSS for a component that has none", async () => {
        const banner = { name: "Test/Banner", source: BANNER_SOURCE };
        const bundle = await bundleOf(banner);

        const result = await validateComponentBundle(banner, {
            ...bundle,
            bundledCss: ".rc-test-banner h2 { margin: 0; }"
        });

        expect(result.errors).toEqual([
            "The component has no CSS, but the bundle has `bundledCss`."
        ]);
    });

    it("rejects a bundle without CSS for a component that has CSS", async () => {
        const bundle = await bundleOf(card);

        const result = await validateComponentBundle(card, { ...bundle, bundledCss: null });

        expect(result.errors).toEqual([
            "The component has CSS, but the bundle has no `bundledCss`."
        ]);
    });

    it("rejects bundled JS that doesn't evaluate", async () => {
        const bundle = await bundleOf(card);

        const result = await validateComponentBundle(card, {
            ...bundle,
            bundledJs: "not javascript("
        });

        expect(result.valid).toBe(false);
        expect(result.errors[0]).toMatch(/^Could not build the manifest for "Test\/Card"/);
    });

    it("rejects a source the bundler would reject", async () => {
        const bundle = await bundleOf(card);

        const result = await validateComponentBundle(
            { ...card, source: `import React from "react";\n${CARD_SOURCE}` },
            bundle
        );

        expect(result.valid).toBe(false);
        expect(result.errors[0]).toContain("import statements");
    });
});
