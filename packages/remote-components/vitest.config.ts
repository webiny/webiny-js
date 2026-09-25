import { createTestConfig } from "../../testing";
// @ts-expect-error Plain build script, no type declarations.
import { generateEsbuildWasmAsset } from "./scripts/generateEsbuildWasmAsset.js";

export default async () => {
    // Tests run against `src`, so the bundler's wasm asset has to be generated here too — the same
    // generator the package build calls, so there is only one way the asset comes into existence.
    await generateEsbuildWasmAsset();

    return createTestConfig({
        path: import.meta.dirname,
        vitestConfig: {
            fileParallelism: true
        }
    });
};
