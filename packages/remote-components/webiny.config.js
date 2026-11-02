import { createWatchPackage, createBuildPackage } from "@webiny/build-tools";
import { generateEsbuildWasmAsset } from "./scripts/generateEsbuildWasmAsset.js";

export default {
    commands: {
        // The wasm asset has to exist in `src` before the package build runs: `rslibCompile` copies
        // non-compilable files through to `dist` as part of compilation, and clears `dist` first.
        build: async (options, context) => {
            await generateEsbuildWasmAsset();
            return createBuildPackage({ cwd: import.meta.dirname })(options, context);
        },
        watch: async (options, context) => {
            await generateEsbuildWasmAsset();
            return createWatchPackage({ cwd: import.meta.dirname })(options, context);
        }
    }
};
