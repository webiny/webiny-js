import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";

/**
 * esbuild's wasm binary has to travel inside the API Lambda bundle: `node_modules` is not deployed,
 * and the Node build of esbuild-wasm can't load it there either way. Raw, it is 13.3 MiB (esbuild-wasm
 * 0.28.2), over the API bundler's default 6 MiB per-asset limit (`WEBINY_INFRA_API_MAX_BUNDLE_SIZE`)
 * and too large to commit. Gzipped it is 3.6 MiB, under the limit, so the compressed copy is
 * generated at build time and rspack emits it as an ordinary asset.
 *
 * It is generated into `src` rather than `dist` so that a single copy serves both consumers:
 * `rslibCompile` copies non-compilable files from `src` straight through to `dist` (for the API
 * bundle), and vitest runs against `src` directly. Watch mode doesn't copy it, so the watch command
 * calls `copyEsbuildWasmAsset`.
 */
const ASSET_PATH = "api/bundler/esbuild.wasm.gz";
const OUTPUT_PATH = path.resolve(import.meta.dirname, "../src", ASSET_PATH);

const resolveWasmSource = () => {
    return fileURLToPath(import.meta.resolve("esbuild-wasm/esbuild.wasm"));
};

/** Whether `output` decompresses to exactly `wasm`. A missing, partial or stale file doesn't. */
const isCurrent = (output, wasm) => {
    if (!fs.existsSync(output)) {
        return false;
    }
    try {
        return zlib.gunzipSync(fs.readFileSync(output)).equals(wasm);
    } catch {
        return false;
    }
};

/** Writes next to the target and renames, so an interrupted write never leaves a partial asset. */
const writeAtomically = (target, contents) => {
    const temporary = `${target}.${process.pid}.${Date.now()}.tmp`;
    try {
        fs.writeFileSync(temporary, contents);
        fs.renameSync(temporary, target);
    } finally {
        fs.rmSync(temporary, { force: true });
    }
};

/**
 * Generates the gzipped asset, unless the existing one already decompresses to the installed binary.
 * The check is by content, not modification time, so an esbuild-wasm upgrade or reinstall always
 * regenerates it. Compressing costs about a second; the check is much cheaper, and both the package
 * build and the test run call this. `source` and `output` are for tests.
 */
export const generateEsbuildWasmAsset = async ({ source, output = OUTPUT_PATH } = {}) => {
    const wasm = fs.readFileSync(source ?? resolveWasmSource());

    if (isCurrent(output, wasm)) {
        return output;
    }

    fs.mkdirSync(path.dirname(output), { recursive: true });
    writeAtomically(output, zlib.gzipSync(wasm, { level: 9 }));

    return output;
};

/** Copies the generated asset into a build output folder (`dist`), at the path the bundler loads. */
export const copyEsbuildWasmAsset = (outputDir, { from = OUTPUT_PATH } = {}) => {
    const target = path.join(outputDir, ASSET_PATH);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    writeAtomically(target, fs.readFileSync(from));

    return target;
};
