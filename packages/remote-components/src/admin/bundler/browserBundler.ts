import { build, initialize } from "esbuild-wasm";
// @ts-expect-error No types available
import * as csstree from "css-tree";
import * as acorn from "acorn";
import acornJsx from "acorn-jsx";
import { createHash } from "~/admin/bundler/sha256.js";

let initialized = false;

async function ensureInitialized(): Promise<void> {
    if (initialized) {
        return;
    }
    await initialize({
        wasmURL: "https://unpkg.com/esbuild-wasm@0.28.1/esbuild.wasm",
        worker: true
    });
    initialized = true;
}

export interface ComponentSource {
    name: string;
    source: string;
    css?: string;
}

export interface BundledComponent {
    name: string;
    source: string;
    bundled: string;
    sha256: string;
    css?: string;
    cssSha256?: string;
}

const jsxParser = acorn.Parser.extend(acornJsx());

function parseSource(source: string): any {
    return jsxParser.parse(source, {
        ecmaVersion: "latest",
        sourceType: "module",
        locations: true
    });
}

function findExportDefaultFunction(ast: any): { name: string; start: number; end: number } {
    for (const node of ast.body) {
        if (
            node.type === "ExportDefaultDeclaration" &&
            node.declaration.type === "FunctionDeclaration"
        ) {
            return {
                name: node.declaration.id.name,
                start: node.start,
                end: node.end
            };
        }
    }
    throw new Error("Could not find `export default function` in component source.");
}

function findManifestExport(ast: any): { objectNode: any; start: number; end: number } {
    for (const node of ast.body) {
        if (
            node.type === "ExportNamedDeclaration" &&
            node.declaration &&
            node.declaration.type === "VariableDeclaration"
        ) {
            for (const decl of node.declaration.declarations) {
                if (
                    decl.id.name === "manifest" &&
                    decl.init &&
                    decl.init.type === "ObjectExpression"
                ) {
                    return {
                        objectNode: decl.init,
                        start: node.start,
                        end: node.end
                    };
                }
            }
        }
    }
    throw new Error("Could not find `export const manifest = { ... }` in component source.");
}

function getStringValue(node: any): string | null {
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
}

function getObjectProperty(node: any, key: string): any | null {
    if (node.type !== "ObjectExpression") {
        return null;
    }
    for (const prop of node.properties) {
        if (prop.type === "Property" && prop.key.type === "Identifier" && prop.key.name === key) {
            return prop.value;
        }
    }
    return null;
}

function collectInputFactories(manifestNode: any): Set<string> {
    const factories = new Set<string>();

    function walk(node: any) {
        if (!node || typeof node !== "object") {
            return;
        }

        if (node.type === "ObjectExpression") {
            const factoryNode = getObjectProperty(node, "factory");
            if (factoryNode) {
                const factory = getStringValue(factoryNode);
                if (factory) {
                    factories.add(factory);
                }
            }
            for (const prop of node.properties) {
                walk(prop.value);
            }
        } else if (node.type === "ArrayExpression") {
            for (const el of node.elements) {
                walk(el);
            }
        }
    }

    walk(manifestNode);
    return factories;
}

function transformInputDefinition(source: string, node: any): string | null {
    if (node.type !== "ObjectExpression") {
        return null;
    }

    const nameNode = getObjectProperty(node, "name");
    const factoryNode = getObjectProperty(node, "factory");
    const paramsNode = getObjectProperty(node, "params");

    if (!nameNode || !factoryNode || !paramsNode) {
        return null;
    }

    const name = getStringValue(nameNode);
    const factory = getStringValue(factoryNode);

    if (!name || !factory || paramsNode.type !== "ObjectExpression") {
        return null;
    }

    const paramsSource = source.slice(paramsNode.start, paramsNode.end);
    const paramsWithName = paramsSource.replace(/^\{/, `{ name: "${name}",`);

    return `${factory}(${paramsWithName})`;
}

function transformInputsArray(source: string, node: any): string {
    if (node.type !== "ArrayExpression") {
        return source.slice(node.start, node.end);
    }

    const parts: string[] = ["["];

    for (let i = 0; i < node.elements.length; i++) {
        const el = node.elements[i];
        if (i > 0) {
            parts.push(", ");
        }

        const transformed = transformInputDefinition(source, el);
        if (transformed) {
            parts.push(transformed);
        } else {
            parts.push(source.slice(el.start, el.end));
        }
    }

    parts.push("]");
    return parts.join("");
}

function transformFieldsInParams(source: string, paramsNode: any): string {
    if (paramsNode.type !== "ObjectExpression") {
        return source.slice(paramsNode.start, paramsNode.end);
    }

    let result = "";
    let lastEnd = paramsNode.start;

    for (const prop of paramsNode.properties) {
        if (
            prop.type === "Property" &&
            prop.key.type === "Identifier" &&
            prop.key.name === "fields" &&
            prop.value.type === "ArrayExpression"
        ) {
            result += source.slice(lastEnd, prop.value.start);
            result += transformInputsArray(source, prop.value);
            lastEnd = prop.value.end;
        }
    }

    result += source.slice(lastEnd, paramsNode.end);
    return result;
}

function transformManifestInputs(source: string, manifestNode: any): string {
    const inputsProp = manifestNode.properties.find(
        (p: any) => p.type === "Property" && p.key.type === "Identifier" && p.key.name === "inputs"
    );

    if (!inputsProp || inputsProp.value.type !== "ArrayExpression") {
        return source.slice(manifestNode.start, manifestNode.end);
    }

    let result = "";
    let lastEnd = manifestNode.start;
    const inputsArray = inputsProp.value;

    result += source.slice(lastEnd, inputsArray.start);
    result += "[";

    for (let i = 0; i < inputsArray.elements.length; i++) {
        const el = inputsArray.elements[i];
        if (i > 0) {
            result += ", ";
        }

        if (el.type !== "ObjectExpression") {
            result += source.slice(el.start, el.end);
            continue;
        }

        const nameNode = getObjectProperty(el, "name");
        const factoryNode = getObjectProperty(el, "factory");
        const paramsNode = getObjectProperty(el, "params");

        if (!nameNode || !factoryNode || !paramsNode) {
            result += source.slice(el.start, el.end);
            continue;
        }

        const name = getStringValue(nameNode);
        const factory = getStringValue(factoryNode);

        if (!name || !factory || paramsNode.type !== "ObjectExpression") {
            result += source.slice(el.start, el.end);
            continue;
        }

        const transformedParams = transformFieldsInParams(source, paramsNode);
        const paramsWithName = transformedParams.replace(/^\{/, `{ name: "${name}",`);

        result += `${factory}(${paramsWithName})`;
    }

    result += "]";
    lastEnd = inputsArray.end;
    result += source.slice(lastEnd, manifestNode.end);

    return result;
}

function scopeClassName(componentName: string): string {
    return `rc-${componentName.replace(/\//g, "-").toLowerCase()}`;
}

function scopeCss(css: string, scope: string): string {
    const ast = csstree.parse(css);

    csstree.walk(ast, {
        visit: "Rule",
        enter(node: any) {
            const selectorList = node.prelude;
            if (!selectorList || selectorList.type !== "SelectorList") {
                return;
            }

            const newSelectors = new (csstree as any).List();

            selectorList.children.forEach((selector: any) => {
                const raw = csstree.generate(selector).trim();
                if (raw.startsWith(":root")) {
                    newSelectors.appendData(selector);
                    return;
                }

                const scoped = csstree.parse(`.${scope} ${raw}`, {
                    context: "selector"
                });
                newSelectors.appendData(scoped);
            });

            selectorList.children = newSelectors;
        }
    });

    return csstree.generate(ast);
}

function fixCommonLlmMistakes(source: string): string {
    return source.replace(/\bmultiple\s*:\s*true\b/g, "list: true");
}

export async function bundleComponentInBrowser(
    component: ComponentSource
): Promise<BundledComponent> {
    await ensureInitialized();

    const source = fixCommonLlmMistakes(component.source);
    const ast = parseSource(source);

    const exportDefault = findExportDefaultFunction(ast);
    const manifestExport = findManifestExport(ast);
    const inputFactories = collectInputFactories(manifestExport.objectNode);

    const componentBody = source
        .slice(exportDefault.start, exportDefault.end)
        .replace(/export\s+default\s+function/, "function");

    const transformedManifest = transformManifestInputs(source, manifestExport.objectNode);

    const sdkDestructure = ["createComponent: _createComponent", ...inputFactories].join(", ");

    const wrappedSource = `
export function createComponent(runtime) {
    const { React, sdk } = runtime.dependencies;
    const { ${sdkDestructure} } = sdk;

    ${componentBody.trim()}

    return _createComponent(${exportDefault.name}, ${transformedManifest});
}
`.trim();

    const result = await build({
        stdin: {
            contents: wrappedSource,
            loader: "jsx",
            resolveDir: "/"
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
    const sha256 = await createHash(bundled);

    let css: string | undefined;
    let cssSha256: string | undefined;

    if (component.css) {
        const scope = scopeClassName(component.name);
        css = scopeCss(component.css, scope);
        cssSha256 = await createHash(css);
    }

    return {
        name: component.name,
        source: component.source,
        bundled,
        sha256,
        css,
        cssSha256
    };
}
