import { build, initialize } from "esbuild-wasm";

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

const GLOBAL_NAME = "__adminRenderer__";

/**
 * PROBE. Wrap generated source in the factory the loader expects, and transpile it.
 *
 * The generated file is written as if it had imports, because that is what a model produces well and
 * what a human can read. They are stripped and replaced by a destructure of the injected runtime, so
 * the bundle resolves nothing at load time — which is what keeps a generated renderer from reaching
 * for a dependency it was not given.
 */
const IMPORT_LINE = /^\s*import\s[\s\S]*?;\s*$/gm;

export const wrapSource = (source: string): string => {
    const body = source
        .replace(IMPORT_LINE, "")
        .replace(/export\s+const\s+/g, "const ")
        .trim();

    return `
export function createRenderer(runtime) {
    const { React, ui, observer, createFieldRenderer, createObjectFieldRenderer } = runtime.dependencies;
    const {
        Button, Icon, IconButton, Input, Text, Tree,
        FormComponentLabel, FormComponentDescription
    } = ui;

    ${body}

    return Renderer;
}
`.trim();
};

export interface BundledRenderer {
    bundled: string;
    warnings: string[];
}

export const bundleRenderer = async (source: string): Promise<BundledRenderer> => {
    await ensureInitialized();

    const result = await build({
        stdin: { contents: wrapSource(source), loader: "jsx", resolveDir: "/" },
        bundle: true,
        format: "iife",
        globalName: GLOBAL_NAME,
        platform: "neutral",
        write: false,
        minify: false,
        jsx: "transform",
        jsxFactory: "React.createElement",
        jsxFragment: "React.Fragment"
    });

    return {
        bundled: result.outputFiles[0].text,
        warnings: result.warnings.map(warning => warning.text)
    };
};
