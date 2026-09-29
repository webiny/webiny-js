import { build, initialize } from "esbuild-wasm";
import * as acorn from "acorn";
import acornJsx from "acorn-jsx";
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

const jsxParser = acorn.Parser.extend(acornJsx());

interface Replacement {
    start: number;
    end: number;
    text: string;
}

function getStringValue(node: any): string | null {
    if (!node) {
        return null;
    }
    if (node.type === "Literal" && typeof node.value === "string") {
        return node.value;
    }
    if (node.type === "TemplateLiteral" && node.expressions.length === 0) {
        return node.quasis[0].value.cooked;
    }
    return null;
}

function getProperty(node: any, key: string): any | null {
    if (!node || node.type !== "ObjectExpression") {
        return null;
    }
    for (const prop of node.properties) {
        if (prop.type !== "Property" || prop.computed) {
            continue;
        }
        const propKey = prop.key.type === "Identifier" ? prop.key.name : prop.key.value;
        if (propKey === key) {
            return prop.value;
        }
    }
    return null;
}

function sliceWithReplacements(
    source: string,
    start: number,
    end: number,
    replacements: Replacement[]
): string {
    let result = "";
    let cursor = start;
    for (const replacement of replacements) {
        result += source.slice(cursor, replacement.start) + replacement.text;
        cursor = replacement.end;
    }
    return result + source.slice(cursor, end);
}

/**
 * Turns a `{ name, factory, params }` descriptor into a `factory({ name, ...params })` call.
 * Descriptors listed in `params.fields` (object inputs) are built the same way, at any depth.
 */
function buildInputDescriptor(source: string, node: any): string | null {
    const name = getStringValue(getProperty(node, "name"));
    const factory = getStringValue(getProperty(node, "factory"));
    const params = getProperty(node, "params");

    if (!name || !factory || !/^create\w+$/.test(factory) || params?.type !== "ObjectExpression") {
        return null;
    }

    const fields = getProperty(params, "fields");
    const replacements =
        fields?.type === "ArrayExpression" ? buildInputDescriptors(source, fields) : [];
    const paramsCode = sliceWithReplacements(source, params.start, params.end, replacements);

    return `${factory}(${paramsCode.replace(/^\{/, `{ name: ${JSON.stringify(name)},`)})`;
}

function buildInputDescriptors(source: string, arrayNode: any): Replacement[] {
    const replacements: Replacement[] = [];
    for (const element of arrayNode.elements) {
        const text = element ? buildInputDescriptor(source, element) : null;
        if (text) {
            replacements.push({ start: element.start, end: element.end, text });
        }
    }
    return replacements;
}

function buildManifestCode(manifestSource: string): string {
    const inputsMatch = manifestSource.match(/inputs\s*:\s*\[([\s\S]*?)\]/);
    if (!inputsMatch) {
        return manifestSource
            .replace(/factory\s*:\s*["'`]create\w+["'`]\s*,?\s*/g, "")
            .replace(/params\s*:\s*\{/g, "{");
    }

    let manifestNode: any;
    try {
        manifestNode = jsxParser.parseExpressionAt(manifestSource, 0, { ecmaVersion: "latest" });
    } catch {
        // Leave the source as-is, so esbuild reports the syntax error with its location.
        return manifestSource;
    }

    const inputs = getProperty(manifestNode, "inputs");
    if (inputs?.type !== "ArrayExpression") {
        return manifestSource;
    }

    return sliceWithReplacements(
        manifestSource,
        0,
        manifestSource.length,
        buildInputDescriptors(manifestSource, inputs)
    );
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
