import { build } from "esbuild-wasm";
import { initialize } from "esbuild-wasm";

export interface CompileSourceParams {
    contents: string;
    /** `tsx` accepts TypeScript annotations as well as JSX; `jsx` rejects them. */
    loader: "jsx" | "tsx";
    /** The variable the IIFE assigns its exports to. */
    globalName: string;
}

export interface CompileSourceError {
    message: string;
    line: number | null;
}

let initialized = false;

async function ensureInitialized(): Promise<void> {
    if (initialized) {
        return;
    }
    await initialize({ worker: false });
    initialized = true;
}

/** The first esbuild error, with its line, or `null` when the failure is not a compile error. */
export function toCompileSourceError(error: unknown): CompileSourceError | null {
    const errors = (error as { errors?: { text: string; location?: { line: number } | null }[] })
        .errors;
    if (!Array.isArray(errors) || errors.length === 0) {
        return null;
    }
    const [first] = errors;
    return { message: first.text, line: first.location?.line ?? null };
}

/**
 * Compiles self-contained source into one IIFE with esbuild's WebAssembly build, so it runs in any
 * Node environment without a native binary. The API bundle must keep `esbuild-wasm` external: it
 * loads its .wasm file from next to its own code. Shared by website components and admin extensions; each
 * wraps the source in its own runtime contract first.
 *
 * Throws esbuild's error on invalid source; `toCompileSourceError` reads it.
 */
export async function compileSource(params: CompileSourceParams): Promise<string> {
    await ensureInitialized();

    const result = await build({
        stdin: {
            contents: params.contents,
            loader: params.loader,
            resolveDir: process.cwd()
        },
        bundle: true,
        format: "iife",
        globalName: params.globalName,
        platform: "neutral",
        write: false,
        minify: false,
        logLevel: "silent",
        jsx: "transform",
        jsxFactory: "React.createElement",
        jsxFragment: "React.Fragment"
    });

    return result.outputFiles[0].text;
}
