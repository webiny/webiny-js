import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { gunzipSync } from "node:zlib";
import type { transform as Transform, build as Build } from "esbuild-wasm";

/**
 * We use esbuild-wasm's *browser* build, not its Node build, even though this runs on the server.
 *
 * The Node build resolves the wasm binary out of `node_modules` and spawns a child process to run
 * it; neither survives bundling into a Lambda. The browser build accepts an already-compiled
 * `WebAssembly.Module` and, with `worker: false`, runs it inline in the current context — no file
 * resolution, no child process, nothing that assumes a browser except `self`, which we alias.
 *
 * The binary itself is emitted alongside this module as a gzipped asset (see
 * `scripts/generateEsbuildWasmAsset.js`). `new URL(..., import.meta.url)` is what rspack recognises
 * as an asset reference, so it rewrites the URL to the emitted file and makes it runtime-relative —
 * which is why this resolves identically under Lambda, local development and standalone, none of
 * which share a working directory.
 */
const wasmAssetUrl = new URL("./esbuild.wasm.gz", import.meta.url);

type EsbuildModule = {
    transform: typeof Transform;
    build: typeof Build;
};

let loading: Promise<EsbuildModule> | undefined;

const load = async (): Promise<EsbuildModule> => {
    // The inline (`worker: false`) path walks the prototype chain of `self` to build its own global
    // object. Node has no `self`, so point it at the real global before the module is evaluated.
    const scope = globalThis as unknown as { self?: unknown };
    scope.self ??= globalThis;

    const esbuild = await import("esbuild-wasm/esm/browser.js");

    const wasmModule = await WebAssembly.compile(
        gunzipSync(await readFile(fileURLToPath(wasmAssetUrl)))
    );

    await esbuild.initialize({ wasmModule, worker: false });

    return { transform: esbuild.transform, build: esbuild.build };
};

/**
 * Decompressing and compiling the binary costs ~70ms and holds ~100 MB, so it happens once per
 * container and only when something actually asks to bundle.
 */
export const loadEsbuild = (): Promise<EsbuildModule> => {
    if (!loading) {
        loading = load();
    }

    return loading;
};
