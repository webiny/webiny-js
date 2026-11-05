import path from "node:path";
import { createWatchPackage, createBuildPackage } from "@webiny/build-tools";
import {
    generateEsbuildWasmAsset,
    copyEsbuildWasmAsset
} from "./scripts/generateEsbuildWasmAsset.js";

export default {
    commands: {
        // The wasm asset has to exist in `src` before the package build runs: `rslibCompile` copies
        // non-compilable files through to `dist` as part of compilation, and clears `dist` first.
        build: async (options, context) => {
            await generateEsbuildWasmAsset();
            return createBuildPackage({ cwd: import.meta.dirname })(options, context);
        },
        // Watch compiles source files only, so the asset is copied into `dist` here.
        watch: async (options, context) => {
            await generateEsbuildWasmAsset();
            copyEsbuildWasmAsset(path.join(import.meta.dirname, "dist"));
            return createWatchPackage({ cwd: import.meta.dirname })(options, context);
        }
    }
};
