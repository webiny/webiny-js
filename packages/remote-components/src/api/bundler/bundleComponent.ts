import { build, initialize } from "esbuild-wasm";
import { createHash } from "node:crypto";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { ComponentSource, BundledComponent } from "./types.js";
import { validateComponentSource } from "./validateComponentSource.js";

function extractManifestSource(source: string): string {
    const match = source.match(/export\s+const\s+manifest\s*=\s*(\{[\s\S]*?\n\};?)/);
    if (!match) {
        throw new Error("Could not extract manifest from component source.");
    }
    return match[1].replace(/;\s*$/, "");
}

function extractInputFactories(manifestSource: string): string[] {
    const factories = new Set<string>();
    const pattern = /factory\s*:\s*["'`](create\w+)["'`]/g;
    let match;
    while ((match = pattern.exec(manifestSource)) !== null) {
        factories.add(match[1]);
    }
    return [...factories];
}

function extractComponentName(source: string): string {
    const match = source.match(/export\s+default\s+function\s+(\w+)/);
    if (!match) {
        throw new Error("Could not extract component function name from source.");
    }
    return match[1];
}

function buildManifestCode(manifestSource: string): string {
    const inputsMatch = manifestSource.match(/inputs\s*:\s*\[([\s\S]*?)\]/);
    if (!inputsMatch) {
        return manifestSource
            .replace(/factory\s*:\s*["'`]create\w+["'`]\s*,?\s*/g, "")
            .replace(/params\s*:\s*\{/g, "{");
    }

    let transformed = manifestSource;
    const inputEntryPattern =
        /\{\s*name\s*:\s*["'`](\w+)["'`]\s*,\s*factory\s*:\s*["'`](create\w+)["'`]\s*,\s*params\s*:\s*(\{[^}]*\})\s*\}/g;

    transformed = transformed.replace(inputEntryPattern, (_, name, factory, params) => {
        const paramsWithName = params.replace(/^\{/, `{ name: "${name}",`);
        return `${factory}(${paramsWithName})`;
    });

    return transformed;
}

function wrapInFactory(
    source: string,
    componentFnName: string,
    manifestSource: string,
    inputFactories: string[]
): string {
    const componentBody = source
        .replace(/export\s+default\s+function/, "function")
        .replace(/export\s+const\s+manifest\s*=\s*\{[\s\S]*?\};?\s*$/, "");

    const sdkDestructure = ["createComponent: _createComponent", ...inputFactories].join(", ");

    const manifestCode = buildManifestCode(manifestSource);

    return `
export function createComponent(runtime) {
    const { React, sdk } = runtime.dependencies;
    const { ${sdkDestructure} } = sdk;

    ${componentBody.trim()}

    return _createComponent(${componentFnName}, ${manifestCode});
}
`.trim();
}

export function scopeClassName(componentName: string): string {
    // Slugify to a valid CSS identifier: any run of non-alphanumerics (spaces, "/", punctuation) becomes
    // a single hyphen. Without this a name like "Testimonials with features" yields "rc-testimonials with
    // features" — three classes on the element and a descendant-combinator selector in the scoped CSS, so
    // the styles never match and the component renders unstyled.
    const slug =
        componentName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "") || "component";
    return `rc-${slug}`;
}

function scopeCss(css: string, scope: string): string {
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

function extractCss(component: ComponentSource): string | null {
    if (component.css) {
        const scope = scopeClassName(component.name);
        return scopeCss(component.css, scope);
    }

    const styleMatch = component.source.match(/\/\*\s*@css\s*\*\/([\s\S]*?)\/\*\s*@end-css\s*\*\//);
    if (styleMatch) {
        const scope = scopeClassName(component.name);
        return scopeCss(styleMatch[1].trim(), scope);
    }

    return null;
}

let initialized = false;

function polyfillCjsGlobals(): void {
    const g = globalThis as any;
    if (typeof g.__filename === "undefined") {
        g.__filename = fileURLToPath(import.meta.url);
        g.__dirname = dirname(g.__filename);
    }
}

async function ensureInitialized(): Promise<void> {
    if (initialized) {
        return;
    }
    polyfillCjsGlobals();
    await initialize({ worker: false });
    initialized = true;
}

export async function bundleComponent(component: ComponentSource): Promise<BundledComponent> {
    await ensureInitialized();

    const validation = validateComponentSource(component.source);
    if (!validation.valid) {
        throw new Error(
            `Invalid component source for "${component.name}":\n${validation.errors.join("\n")}`
        );
    }

    const componentFnName = extractComponentName(component.source);
    const manifestSource = extractManifestSource(component.source);
    const inputFactories = extractInputFactories(manifestSource);
    const wrappedSource = wrapInFactory(
        component.source,
        componentFnName,
        manifestSource,
        inputFactories
    );

    const result = await build({
        stdin: {
            contents: wrappedSource,
            loader: "jsx",
            resolveDir: process.cwd()
        },
        bundle: true,
        format: "iife",
        globalName: "__remoteComponent__",
        platform: "neutral",
        write: false,
        minify: false,
        jsx: "transform",
        jsxFactory: "React.createElement",
        jsxFragment: "React.Fragment"
    });

    const bundled = result.outputFiles[0].text;
    const sha256 = createHash("sha256").update(bundled).digest("hex");

    const css = extractCss(component);
    const cssSha256 = css ? createHash("sha256").update(css).digest("hex") : undefined;

    return {
        name: component.name,
        source: component.source,
        bundled,
        sha256,
        css: css || undefined,
        cssSha256
    };
}

export async function bundleComponents(components: ComponentSource[]): Promise<BundledComponent[]> {
    return Promise.all(components.map(component => bundleComponent(component)));
}
