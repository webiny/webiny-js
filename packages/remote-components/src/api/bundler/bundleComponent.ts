import { createHash } from "node:crypto";
import { compileSource } from "./compileSource.js";
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

function scopeClassName(componentName: string): string {
    return `rc-${componentName.replace(/\//g, "-").toLowerCase()}`;
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

export async function bundleComponent(component: ComponentSource): Promise<BundledComponent> {
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

    const bundled = await compileSource({
        contents: wrappedSource,
        loader: "jsx",
        globalName: "__remoteComponent__"
    });

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
