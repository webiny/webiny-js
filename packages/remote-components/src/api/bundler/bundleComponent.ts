import { build, initialize } from "esbuild-wasm";
// @ts-expect-error No types available
import * as csstree from "css-tree";
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

function scopeClassName(componentName: string): string {
    return `rc-${componentName.replace(/\//g, "-").toLowerCase()}`;
}

function scopeCssWithRegex(css: string, scope: string): string {
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

interface PreludeEdit {
    start: number;
    end: number;
    text: string;
}

/**
 * Prefixes the selectors of every rule, including rules inside at-rules such as `@media`.
 * Only selector preludes are rewritten, in place, so declarations, comments and whitespace
 * stay as written. The replaced range matches what the previous regex replaced (whitespace
 * before the selector up to the `{`), so CSS without at-rules produces the same output.
 * Nested rules are left alone, since their `&` already refers to the scoped parent.
 */
function scopeCss(css: string, scope: string): string {
    const edits: PreludeEdit[] = [];

    try {
        const ast = csstree.parse(css, {
            positions: true,
            onParseError(error: Error) {
                throw error;
            }
        });

        csstree.walk(ast, {
            visit: "Rule",
            enter(this: any, node: any) {
                // Keyframe selectors (`from`, `50%`) are not element selectors.
                if (this.atrule && /keyframes$/i.test(this.atrule.name)) {
                    return;
                }
                // A nested rule resolves `&` against its already scoped parent.
                if (this.rule) {
                    return;
                }
                const prelude = node.prelude;
                if (
                    !prelude ||
                    prelude.type !== "SelectorList" ||
                    !prelude.loc ||
                    !node.block?.loc
                ) {
                    return;
                }

                const selectors: any[] = prelude.children.toArray();
                const texts: string[] = selectors.map((selector: any) =>
                    css.slice(selector.loc.start.offset, selector.loc.end.offset).trim()
                );
                if (texts.every(text => text.startsWith(":root"))) {
                    return;
                }

                let start = prelude.loc.start.offset;
                while (start > 0 && /\s/.test(css[start - 1])) {
                    start--;
                }
                const end = node.block.loc.start.offset;

                // Keep any comments around the selectors; normalize plain separators to ", "
                // and drop whitespace before the `{`, as the regex did.
                let text = css.slice(start, selectors[0].loc.start.offset).trim();
                texts.forEach((selector, index) => {
                    text += selector.startsWith(":root") ? selector : `.${scope} ${selector}`;
                    const gapEnd =
                        index < selectors.length - 1 ? selectors[index + 1].loc.start.offset : end;
                    const gap = css.slice(selectors[index].loc.end.offset, gapEnd);
                    if (index < selectors.length - 1) {
                        text += /^\s*,\s*$/.test(gap) ? ", " : gap;
                    } else {
                        text += gap.trimEnd();
                    }
                });

                edits.push({ start, end, text });
            }
        });
    } catch {
        return scopeCssWithRegex(css, scope);
    }

    let scoped = css;
    for (const edit of edits.sort((a, b) => b.start - a.start)) {
        scoped = scoped.slice(0, edit.start) + edit.text + scoped.slice(edit.end);
    }
    return scoped;
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
