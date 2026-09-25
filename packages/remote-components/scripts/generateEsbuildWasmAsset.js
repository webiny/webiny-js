import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";

/**
 * esbuild's wasm binary has to travel inside the API Lambda bundle: `node_modules` is not deployed,
 * and the Node build of esbuild-wasm cannot load it there either way. At 13.3 MiB raw it exceeds the
 * per-asset ceiling the API bundler enforces (8 MiB on this project), and it is far too large to
 * commit. Gzipped it is 3.6 MiB, which clears the ceiling, so we generate the compressed copy at
 * build time and let rspack emit it as an ordinary asset.
 *
 * It is generated into `src` rather than `dist` so that a single copy serves both consumers:
 * `rslibCompile` copies non-compilable files from `src` straight through to `dist` (for the API
 * bundle), and vitest runs against `src` directly.
 */
const OUTPUT_PATH = path.resolve(import.meta.dirname, "../src/api/bundler/esbuild.wasm.gz");

const resolveWasmSource = async () => {
    return fileURLToPath(await import.meta.resolve("esbuild-wasm/esbuild.wasm"));
};

export const generateEsbuildWasmAsset = async () => {
    const source = await resolveWasmSource();

    // Regenerating costs ~1s, and both the package build and the test run call this. Skip when the
    // existing copy is already newer than the binary it was made from (i.e. esbuild-wasm has not
    // been upgraded since).
    if (fs.existsSync(OUTPUT_PATH)) {
        const isCurrent = fs.statSync(OUTPUT_PATH).mtimeMs >= fs.statSync(source).mtimeMs;

        if (isCurrent) {
            return OUTPUT_PATH;
        }
    }

    fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
    fs.writeFileSync(OUTPUT_PATH, zlib.gzipSync(fs.readFileSync(source), { level: 9 }));

    return OUTPUT_PATH;
};
