import { describe, expect, it } from "vitest";
import { bundleComponent } from "~/api/bundler/bundleComponent.js";
import { deriveComponentBundle } from "./deriveComponentBundle.js";

/**
 * The conformance fixtures.
 *
 * There is one bundler now. The editor's second one was deleted once its only caller went away, so
 * this suite is no longer proving that two implementations agree — it is a regression guard on the
 * one derivation's output, and that is what it should be read as.
 *
 * What it guards is worth keeping, because each fixture is a shape that actually broke. The table
 * below is the measured state of the two derivations before they were merged, kept because it is the
 * reasoning behind the fixture list rather than a claim about code that still exists:
 *
 *   fixture                 server            editor
 *   module-level constant   ok                drops the constant
 *   helper component        ok                drops the helper
 *   nested object input     fails to parse    ok
 *   list input              fails to parse    ok
 *   css                     ok                ok, but byte-different output (so a different sha)
 *   manifest not last       component deleted ok
 *
 * Neither side was the good one. That was the case for a single derivation rather than for a rule
 * about which bundler to trust — and the reason the editor's bundler is gone rather than fixed.
 *
 * The seventh fixture — a manifest referring to a module-scope constant — came from persisting the
 * manifest: it is the case that proves the manifest has to be taken from the bundle, where the
 * component body is in scope, rather than evaluated on its own.
 *
 * Fixtures are written the way a model actually emits components — the rules in
 * `buildComponentPrompt.ts` permit more than one shape, and the derivation has to handle the set the
 * rules allow, not the one shape that has happened to show up so far.
 */

const moduleLevelConstant = {
    name: "Custom/Badge",
    source: `
const TONES = { info: "#2563eb", warn: "#d97706" };

export default function Badge({ inputs }) {
    return <span style={{ color: TONES[inputs.tone] }}>{inputs.label}</span>;
}

export const manifest = {
    name: "Custom/Badge",
    label: "Badge",
    inputs: [
        { name: "label", factory: "createTextInput", params: { label: "Label", defaultValue: "New" } },
        { name: "tone", factory: "createTextInput", params: { label: "Tone", defaultValue: "info" } }
    ]
};
`.trim()
};

const helperComponent = {
    name: "Custom/Testimonials",
    source: `
function Quote({ text, author }) {
    return <figure><blockquote>{text}</blockquote><figcaption>{author}</figcaption></figure>;
}

export default function Testimonials({ inputs }) {
    return <section>{inputs.quotes.map((q, i) => <Quote key={i} text={q.text} author={q.author} />)}</section>;
}

export const manifest = {
    name: "Custom/Testimonials",
    label: "Testimonials",
    inputs: [
        { name: "heading", factory: "createTextInput", params: { label: "Heading", defaultValue: "What people say" } }
    ]
};
`.trim()
};

const nestedObjectInput = {
    name: "Custom/Callout",
    source: `
export default function Callout({ inputs }) {
    return <aside><h3>{inputs.cta.label}</h3><a href={inputs.cta.url}>{inputs.cta.label}</a></aside>;
}

export const manifest = {
    name: "Custom/Callout",
    label: "Callout",
    inputs: [
        {
            name: "cta",
            factory: "createObjectInput",
            params: {
                label: "Call to action",
                fields: [
                    { name: "label", factory: "createTextInput", params: { label: "Label", defaultValue: "Get Started" } },
                    { name: "url", factory: "createTextInput", params: { label: "URL", defaultValue: "#" } }
                ]
            }
        }
    ]
};
`.trim()
};

const listInput = {
    name: "Custom/CardGrid",
    source: `
export default function CardGrid({ inputs }) {
    return <div>{inputs.cards.map((c, i) => <article key={i}><h4>{c.title}</h4><p>{c.description}</p></article>)}</div>;
}

export const manifest = {
    name: "Custom/CardGrid",
    label: "Card Grid",
    inputs: [
        {
            name: "cards",
            factory: "createObjectInput",
            params: {
                list: true,
                label: "Cards",
                fields: [
                    { name: "title", factory: "createTextInput", params: { label: "Title", defaultValue: "Feature" } },
                    { name: "description", factory: "createLongTextInput", params: { label: "Description" } }
                ]
            }
        }
    ]
};
`.trim()
};

const withCss = {
    name: "Testimonials with features",
    source: `
export default function Panel({ inputs }) {
    return <div className="panel"><h2>{inputs.title}</h2></div>;
}

export const manifest = {
    name: "Custom/Panel",
    label: "Panel",
    inputs: [
        { name: "title", factory: "createTextInput", params: { label: "Title", defaultValue: "Panel" } }
    ]
};
`.trim(),
    css: `:root { --gap: 8px; }\n.panel { padding: var(--gap); }\n.panel h2, .panel p { margin: 0; }`
};

const manifestNotLast = {
    name: "Custom/Hero",
    source: `
export const manifest = {
    name: "Custom/Hero",
    label: "Hero",
    inputs: [
        { name: "title", factory: "createTextInput", params: { label: "Title", defaultValue: "Hello" } }
    ]
};

const GREETING = "Welcome";

export default function Hero({ inputs }) {
    return <section><h1>{GREETING}, {inputs.title}</h1></section>;
}
`.trim()
};

const manifestUsesModuleScope = {
    name: "Custom/Body",
    source: `
const BODY_DEFAULT = "Tell your story here.";

export default function Body({ inputs }) {
    return <p>{inputs.text}</p>;
}

export const manifest = {
    name: "Custom/Body",
    label: "Body",
    inputs: [
        { name: "text", factory: "createLongTextInput", params: { label: "Text", defaultValue: BODY_DEFAULT } }
    ]
};
`.trim()
};

const probesTheHostGlobals = {
    name: "Custom/Probe",
    source: `
const REACHED = typeof process === "undefined" ? "isolated" : "leaked";

export default function Probe({ inputs }) {
    return <p>{inputs.note}</p>;
}

export const manifest = {
    name: "Custom/Probe",
    label: "Probe",
    inputs: [
        { name: "note", factory: "createTextInput", params: { label: "Note", defaultValue: REACHED } }
    ]
};
`.trim()
};

// From next's browser bundler (#5890): the manifest's statement declares something else too.
const manifestWithAnotherDeclarator = {
    name: "Custom/Badge",
    source: `
export const manifest = { name: "Custom/Badge", label: "Badge", inputs: [] }, SIZE = 20;

export default function Badge() {
    return <span>{SIZE}</span>;
}
`.trim()
};

describe("bundler conformance", () => {
    it("keeps module-level constants, which are part of the component", async () => {
        const { bundled } = await bundleComponent(moduleLevelConstant);

        expect(bundled).toContain("TONES");
        expect(bundled).toContain("#2563eb");
    });

    it("keeps helper components declared alongside the default export", async () => {
        const { bundled } = await bundleComponent(helperComponent);

        expect(bundled).toContain("function Quote");
        expect(bundled).toContain("blockquote");
    });

    it("builds factory calls for a nested object input", async () => {
        const { bundled } = await bundleComponent(nestedObjectInput);

        // The outer descriptor and both nested ones become calls, not object literals.
        expect(bundled).toContain("createObjectInput(");
        expect(bundled).toContain("createTextInput(");
        expect(bundled).not.toMatch(/factory:\s*"create/);
        // Each nested field keeps its own name.
        expect(bundled).toContain('name: "label"');
        expect(bundled).toContain('name: "url"');
    });

    it("builds factory calls for a list input", async () => {
        const { bundled } = await bundleComponent(listInput);

        expect(bundled).toContain("createObjectInput(");
        expect(bundled).toContain("createLongTextInput(");
        expect(bundled).not.toMatch(/factory:\s*"create/);
        expect(bundled).toContain("list: true");
    });

    it("scopes CSS to one slugified class and leaves :root alone", async () => {
        const { css, cssSha256 } = await bundleComponent(withCss);

        // "Testimonials with features" must become a single valid identifier.
        expect(css).toContain(".rc-testimonials-with-features .panel");
        // :root custom properties stay global, or the variables resolve to nothing.
        expect(css).toContain(":root");
        expect(css).not.toContain(".rc-testimonials-with-features :root");
        // A selector list is scoped per selector, not once for the whole list.
        expect(css).toContain(".rc-testimonials-with-features .panel h2");
        expect(css).toContain(".rc-testimonials-with-features .panel p");
        expect(cssSha256).toMatch(/^[0-9a-f]{64}$/);
        // Pinned exactly. The two bundlers used to scope CSS by different means — a regex on the
        // server, css-tree in the editor — which agreed on selectors but not on whitespace, so the
        // same component hashed differently depending on where it was bundled. cssSha256 is meant
        // to answer "has this changed", and it could not.
        expect(css).toBe(
            ":root{--gap: 8px}" +
                ".rc-testimonials-with-features .panel{padding:var(--gap)}" +
                ".rc-testimonials-with-features .panel h2,.rc-testimonials-with-features .panel p{margin:0}"
        );
    });

    it("bundles a component whose manifest is not the last export", async () => {
        const { bundled } = await bundleComponent(manifestNotLast);

        // Everything after the manifest survives: the constant and the component itself.
        expect(bundled).toContain("Welcome");
        expect(bundled).toContain("function Hero");
        expect(bundled).toContain("__remoteComponent__");
    });

    it("declares every factory the manifest uses, at any depth", () => {
        const { wrappedSource } = deriveComponentBundle(listInput);

        expect(wrappedSource).toContain("createObjectInput");
        expect(wrappedSource).toContain("createLongTextInput");
        expect(wrappedSource).toContain("createTextInput");
    });

    it("leaves no export keyword inside the wrapper function body", () => {
        for (const fixture of [moduleLevelConstant, helperComponent, manifestNotLast]) {
            const { wrappedSource } = deriveComponentBundle(fixture);
            const body = wrappedSource.slice(wrappedSource.indexOf("{") + 1);

            expect(body).not.toMatch(/\bexport\b/);
        }
    });

    it("persists a manifest built from the same expression the bundle embeds", async () => {
        const { manifest, bundled } = await bundleComponent(nestedObjectInput);
        const parsed = JSON.parse(manifest);

        // Descriptors became real inputs, not the `{ name, factory, params }` shape.
        expect(parsed.inputs).toHaveLength(1);
        expect(parsed.inputs[0].name).toBe("cta");
        expect(parsed.inputs[0].factory).toBeUndefined();
        expect(parsed.inputs[0].type).toBeDefined();

        // Nested fields were built too, which is the case the old recovery code existed to handle.
        expect(parsed.inputs[0].fields).toHaveLength(2);
        expect(parsed.inputs[0].fields.map((f: { name: string }) => f.name)).toEqual([
            "label",
            "url"
        ]);

        // The manifest carries the name the component was stored under, not what the model wrote:
        // a collision rename at Promote makes the two differ, and the page element records the former.
        expect(parsed.name).toBe("Custom/Callout");
        // Same factories in the manifest as in the bundle, because it is the same expression.
        expect(bundled).toContain("createObjectInput(");
    });

    it("builds a manifest for a list input", async () => {
        const { manifest } = await bundleComponent(listInput);
        const parsed = JSON.parse(manifest);

        expect(parsed.inputs[0].name).toBe("cards");
        expect(parsed.inputs[0].list).toBe(true);
        expect(parsed.inputs[0].fields).toHaveLength(2);
    });

    it("builds a manifest that refers to a module-scope constant", async () => {
        // The manifest is not necessarily self-contained. Evaluating the manifest expression on its
        // own throws `BODY_DEFAULT is not defined`; taking it from the bundle, where the component
        // body is in scope, is what makes it work. 4 of the 118 stored components do this.
        const { manifest } = await bundleComponent(manifestUsesModuleScope);
        const parsed = JSON.parse(manifest);

        expect(parsed.inputs[0].defaultValue).toBe("Tell your story here.");
    });

    it("builds the manifest without the host's globals in scope", async () => {
        // Building the manifest means executing model-generated code derived from captured
        // third-party pages. It runs in a fresh vm context, so `process` — and with it the Lambda's
        // environment and credentials — is not reachable. `new Function` would have handed it over.
        const { manifest } = await bundleComponent(probesTheHostGlobals);

        expect(JSON.parse(manifest).inputs[0].defaultValue).toBe("isolated");
    });

    it("normalises `multiple: true`, which models emit in place of `list: true`", () => {
        const { wrappedSource } = deriveComponentBundle({
            name: "Custom/Slips",
            source: listInput.source.replace("list: true", "multiple: true")
        });

        expect(wrappedSource).toContain("list: true");
        expect(wrappedSource).not.toContain("multiple: true");
    });
    it("keeps the other declarators of the manifest's statement", async () => {
        const { bundled } = await bundleComponent(manifestWithAnotherDeclarator);

        expect(bundled).toMatch(/SIZE = 20/);
        expect(bundled).toContain("Custom/Badge");
    });
});
