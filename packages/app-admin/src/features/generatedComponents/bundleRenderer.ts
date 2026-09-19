import { build, initialize, version } from "esbuild-wasm";

let initialized: Promise<void> | null = null;

/*
 * The wasm binary must be the exact version of the JS half. A mismatch throws inside the worker,
 * where nothing rejects this promise — the caller just waits forever — so take the version from the
 * package itself rather than writing it out and letting it drift on the next bump.
 */
function ensureInitialized(): Promise<void> {
    if (!initialized) {
        initialized = initialize({
            wasmURL: `https://unpkg.com/esbuild-wasm@${version}/esbuild.wasm`,
            worker: true
        });
    }
    return initialized;
}

const GLOBAL_NAME = "__adminRenderer__";

/**
 * Wrap generated source in the factory the loader expects, and transpile it.
 *
 * The generated file is written as if it had imports, because that is what a model produces well and
 * what a human can read. They are stripped and replaced by a destructure of the injected runtime, so
 * the bundle resolves nothing at load time — which is what keeps a generated renderer from reaching
 * for a dependency it was not given.
 */
const IMPORT_LINE = /^\s*import\s[\s\S]*?;\s*$/gm;

/**
 * The `admin-ui` components a generated renderer may use, by name.
 *
 * This is the definition, not a copy of one. The wrapper below destructures exactly these, and the
 * contract handed to the assistant is generated from this same list, so a component cannot be
 * described as available without being in scope or vice versa. Adding one here is the only step
 * needed; regenerate the contract afterwards.
 */
export const INJECTED_COMPONENTS = [
    "Button",
    "Icon",
    "IconButton",
    "Input",
    "Text",
    "Tree",
    "FormComponentLabel",
    "FormComponentDescription"
] as const;

/** The non-component globals a generated renderer is given. */
export const INJECTED_GLOBALS = [
    "React",
    "ui",
    "observer",
    "createFieldRenderer",
    "createObjectFieldRenderer"
] as const;

export const wrapSource = (source: string): string => {
    const body = source
        .replace(IMPORT_LINE, "")
        .replace(/export\s+const\s+/g, "const ")
        .trim();

    return `
export function createRenderer(runtime) {
    const { ${INJECTED_GLOBALS.join(", ")} } = runtime.dependencies;
    const { ${INJECTED_COMPONENTS.join(", ")} } = ui;

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
        /*
         * `tsx`, not `jsx`. Everything about this calls the input TSX, and a model asked for TSX
         * writes type annotations without being told to. Under the `jsx` loader the first `: any`
         * is a syntax error, which reads as "the generated code is broken" when the loader was the
         * thing that was wrong. Types are erased here, never checked.
         */
        stdin: { contents: wrapSource(source), loader: "tsx", resolveDir: "/" },
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
