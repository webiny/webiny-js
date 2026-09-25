import * as acorn from "acorn";
import acornJsx from "acorn-jsx";
// css-tree's main entry reaches `data-patch.js`, which does `createRequire(import.meta.url)` and
// requires a JSON file by relative path. rspack cannot follow that, so it emits the require with the
// build machine's absolute path inlined — which exists on no Lambda, and the API fails to start
// before it serves a single request. These four narrow entry points do parse/walk/generate without
// pulling in the lexer's syntax data, and produce byte-identical output.
// @ts-expect-error No types available
import parseCss from "css-tree/parser";
// @ts-expect-error No types available
import walkCss from "css-tree/walker";
// @ts-expect-error No types available
import generateCss from "css-tree/generator";
// @ts-expect-error No types available
import { List } from "css-tree/utils";
import { scopeClassName } from "./scopeClassName.js";
import type { ComponentSource } from "./types.js";

/**
 * Everything the server bundler and the editor's preview bundler have to agree on, in one place.
 *
 * They used to hold two independent derivations. Both were wrong, in different ways and on
 * different inputs: the editor sliced out only the default export and dropped the rest of module
 * scope, while the server stripped the manifest with a pattern anchored to end-of-string and built
 * its input factory calls with a regex that cannot cross a nested `}`. A component could bundle in
 * one and be silently broken in the other, and nothing compared them.
 *
 * This module derives, from a component's source, the two things a bundler needs: the wrapped
 * source to hand esbuild, and the scoped CSS. It is deliberately free of anything environment
 * specific — no esbuild, no hashing, no filesystem — so the two bundlers differ only in what they
 * inject, and a conformance test can check the derivation itself.
 */

export interface ComponentDerivation {
    /** The component's own function name, as declared on the default export. */
    componentName: string;
    /** The single module handed to esbuild's stdin. */
    wrappedSource: string;
    /** Scoped CSS, or null when the component has none. */
    css: string | null;
}

interface Range {
    start: number;
    end: number;
}

type Node = any;

const jsxParser = acorn.Parser.extend(acornJsx());

const parseSource = (source: string): Node => {
    return jsxParser.parse(source, {
        ecmaVersion: "latest",
        sourceType: "module",
        locations: true
    });
};

const getStringValue = (node: Node): string | null => {
    if (node.type === "Literal" && typeof node.value === "string") {
        return node.value;
    }

    if (
        node.type === "TemplateLiteral" &&
        node.expressions.length === 0 &&
        node.quasis.length === 1
    ) {
        return node.quasis[0].value.cooked;
    }

    return null;
};

const getObjectProperty = (node: Node, key: string): Node | null => {
    if (node.type !== "ObjectExpression") {
        return null;
    }

    for (const prop of node.properties) {
        if (prop.type === "Property" && prop.key.type === "Identifier" && prop.key.name === key) {
            return prop.value;
        }
    }

    return null;
};

const findExportDefaultFunction = (ast: Node): { name: string } & Range => {
    for (const node of ast.body) {
        if (
            node.type === "ExportDefaultDeclaration" &&
            node.declaration.type === "FunctionDeclaration"
        ) {
            return { name: node.declaration.id.name, start: node.start, end: node.end };
        }
    }

    throw new Error("Could not find `export default function` in component source.");
};

const findManifestExport = (ast: Node): { objectNode: Node } & Range => {
    for (const node of ast.body) {
        if (
            node.type !== "ExportNamedDeclaration" ||
            node.declaration?.type !== "VariableDeclaration"
        ) {
            continue;
        }

        for (const decl of node.declaration.declarations) {
            if (decl.id.name === "manifest" && decl.init?.type === "ObjectExpression") {
                return { objectNode: decl.init, start: node.start, end: node.end };
            }
        }
    }

    throw new Error("Could not find `export const manifest = { ... }` in component source.");
};

const collectInputFactories = (manifestNode: Node): Set<string> => {
    const factories = new Set<string>();

    const walk = (node: Node) => {
        if (!node || typeof node !== "object") {
            return;
        }

        if (node.type === "ObjectExpression") {
            const factoryNode = getObjectProperty(node, "factory");
            const factory = factoryNode ? getStringValue(factoryNode) : null;

            if (factory) {
                factories.add(factory);
            }

            for (const prop of node.properties) {
                walk(prop.value);
            }
        } else if (node.type === "ArrayExpression") {
            for (const el of node.elements) {
                walk(el);
            }
        }
    };

    walk(manifestNode);

    return factories;
};

/**
 * The component body is the whole module minus its export keywords, not just the default export.
 * Constants, helper components and utilities at module scope are part of the component and the
 * wrapped source has to keep them; slicing out only the default export leaves the bundle
 * referencing names that no longer exist.
 *
 * Exports are removed rather than rewritten because the body ends up inside a function, where an
 * `export` is a syntax error.
 */
const deriveComponentBody = (source: string, ast: Node, manifest: Range): string => {
    const edits: { range: Range; replacement: string }[] = [{ range: manifest, replacement: "" }];

    for (const node of ast.body) {
        if (node.start === manifest.start && node.end === manifest.end) {
            continue;
        }

        if (node.type === "ExportDefaultDeclaration") {
            // `export default function Foo()` -> `function Foo()`.
            edits.push({
                range: { start: node.start, end: node.declaration.start },
                replacement: ""
            });
        } else if (node.type === "ExportNamedDeclaration" && node.declaration) {
            // `export const helper = ...` -> `const helper = ...`.
            edits.push({
                range: { start: node.start, end: node.declaration.start },
                replacement: ""
            });
        } else if (node.type === "ExportNamedDeclaration" || node.type === "ExportAllDeclaration") {
            // A specifier-only re-export has no declaration to keep.
            edits.push({ range: { start: node.start, end: node.end }, replacement: "" });
        }
    }

    edits.sort((a, b) => a.range.start - b.range.start);

    let result = "";
    let cursor = 0;

    for (const edit of edits) {
        result += source.slice(cursor, edit.range.start) + edit.replacement;
        cursor = edit.range.end;
    }

    return (result + source.slice(cursor)).trim();
};

/**
 * Rewrites `{ name, factory, params }` input descriptors into calls to the factory, at any depth.
 * Nesting is the whole point: `createObjectInput` carries a `fields` array of further descriptors,
 * and list inputs nest the same way.
 */
const transformInputDescriptors = (source: string, node: Node): string => {
    if (node.type !== "ArrayExpression") {
        return source.slice(node.start, node.end);
    }

    const parts = node.elements.map((el: Node) => {
        if (!el || el.type !== "ObjectExpression") {
            return source.slice(el.start, el.end);
        }

        const nameNode = getObjectProperty(el, "name");
        const factoryNode = getObjectProperty(el, "factory");
        const paramsNode = getObjectProperty(el, "params");

        if (!nameNode || !factoryNode || !paramsNode || paramsNode.type !== "ObjectExpression") {
            return source.slice(el.start, el.end);
        }

        const name = getStringValue(nameNode);
        const factory = getStringValue(factoryNode);

        if (!name || !factory) {
            return source.slice(el.start, el.end);
        }

        const params = transformNestedFields(source, paramsNode);

        return `${factory}(${params.replace(/^\{/, `{ name: ${JSON.stringify(name)},`)})`;
    });

    return `[${parts.join(", ")}]`;
};

/** Recurses into a params object's `fields`, so nested descriptors are transformed too. */
const transformNestedFields = (source: string, paramsNode: Node): string => {
    let result = "";
    let cursor = paramsNode.start;

    for (const prop of paramsNode.properties) {
        const isFields =
            prop.type === "Property" &&
            prop.key.type === "Identifier" &&
            prop.key.name === "fields" &&
            prop.value.type === "ArrayExpression";

        if (isFields) {
            result += source.slice(cursor, prop.value.start);
            result += transformInputDescriptors(source, prop.value);
            cursor = prop.value.end;
        }
    }

    return result + source.slice(cursor, paramsNode.end);
};

const transformManifest = (source: string, manifestNode: Node): string => {
    const inputsProp = manifestNode.properties.find(
        (p: Node) => p.type === "Property" && p.key.type === "Identifier" && p.key.name === "inputs"
    );

    if (!inputsProp || inputsProp.value.type !== "ArrayExpression") {
        return source.slice(manifestNode.start, manifestNode.end);
    }

    const inputs = inputsProp.value;

    return (
        source.slice(manifestNode.start, inputs.start) +
        transformInputDescriptors(source, inputs) +
        source.slice(inputs.end, manifestNode.end)
    );
};

const scopeCss = (css: string, scope: string): string => {
    const ast = parseCss(css);

    walkCss(ast, {
        visit: "Rule",
        enter(node: Node) {
            const selectorList = node.prelude;

            if (!selectorList || selectorList.type !== "SelectorList") {
                return;
            }

            const scoped = new List();

            selectorList.children.forEach((selector: Node) => {
                const raw = generateCss(selector).trim();

                if (raw.startsWith(":root")) {
                    scoped.appendData(selector);
                    return;
                }

                scoped.appendData(parseCss(`.${scope} ${raw}`, { context: "selector" }));
            });

            selectorList.children = scoped;
        }
    });

    return generateCss(ast);
};

const extractCss = (component: ComponentSource): string | null => {
    if (component.css) {
        return component.css;
    }

    const inline = component.source.match(/\/\*\s*@css\s*\*\/([\s\S]*?)\/\*\s*@end-css\s*\*\//);

    return inline ? inline[1].trim() : null;
};

/**
 * Models are asked for `list: true` but reach for `multiple: true` often enough to be worth
 * normalising. Applied before parsing so both bundlers see the same source.
 */
const normalizeKnownModelSlips = (source: string): string => {
    return source.replace(/\bmultiple\s*:\s*true\b/g, "list: true");
};

export const deriveComponentBundle = (component: ComponentSource): ComponentDerivation => {
    const source = normalizeKnownModelSlips(component.source);
    const ast = parseSource(source);

    const exportDefault = findExportDefaultFunction(ast);
    const manifest = findManifestExport(ast);

    const componentBody = deriveComponentBody(source, ast, manifest);
    const manifestCode = transformManifest(source, manifest.objectNode);
    const factories = collectInputFactories(manifest.objectNode);

    const sdkDestructure = ["createComponent: _createComponent", ...factories].join(", ");

    const wrappedSource = `
export function createComponent(runtime) {
    const { React, sdk } = runtime.dependencies;
    const { ${sdkDestructure} } = sdk;

    ${componentBody}

    return _createComponent(${exportDefault.name}, ${manifestCode});
}
`.trim();

    const rawCss = extractCss(component);

    return {
        componentName: exportDefault.name,
        wrappedSource,
        css: rawCss ? scopeCss(rawCss, scopeClassName(component.name)) : null
    };
};

/** The esbuild options both bundlers use. Components carry no imports, so nothing is resolved. */
export const ESBUILD_OPTIONS = {
    bundle: true,
    format: "iife",
    globalName: "__remoteComponent__",
    platform: "neutral",
    write: false,
    minify: false,
    jsx: "transform",
    jsxFactory: "React.createElement",
    jsxFragment: "React.Fragment"
} as const;
