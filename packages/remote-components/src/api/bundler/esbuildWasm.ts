import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { gunzipSync } from "node:zlib";
import type { transform as Transform, build as Build } from "esbuild-wasm";

/**
 * esbuild-wasm's browser build, not its Node build, even though this runs on the server.
 *
 * The Node build resolves the wasm binary out of `node_modules` and runs it in a child process;
 * neither survives bundling into a Lambda. The browser build accepts a compiled `WebAssembly.Module`
 * and, with `worker: false`, runs it in the current process. It assumes a browser only through
 * `self`, which is aliased below.
 *
 * The binary is a gzipped asset next to this module (see `scripts/generateEsbuildWasmAsset.js`).
 * rspack recognises `new URL(..., import.meta.url)` as an asset reference, emits the file and makes
 * the URL relative to the running module, so it resolves the same in a Lambda, in local development
 * and from `node_modules`.
 */
const wasmAssetUrl = new URL("./esbuild.wasm.gz", import.meta.url);

type EsbuildModule = {
    transform: typeof Transform;
    build: typeof Build;
};

let loading: Promise<EsbuildModule> | undefined;

async function load(): Promise<EsbuildModule> {
    // The in-process path builds its own global object from the prototype chain of `self`. Node has
    // no `self`, so point it at the real global before the module is evaluated.
    const scope = globalThis as unknown as { self?: unknown };
    scope.self ??= globalThis;

    const esbuild = await import("esbuild-wasm/esm/browser.js");

    const wasmPath = fileURLToPath(wasmAssetUrl);
    const wasmGzip = await readFile(wasmPath);
    const wasmModule = await WebAssembly.compile(gunzipSync(wasmGzip));

    await esbuild.initialize({ wasmModule, worker: false });

    return { transform: esbuild.transform, build: esbuild.build };
}

/**
 * Decompressing and compiling the binary happens once per process, on the first call. Measured
 * locally, a first bundle in a fresh process takes about 200 ms.
 */
export function loadEsbuild(): Promise<EsbuildModule> {
    if (!loading) {
        loading = load();
    }

    return loading;
}
