import { createTestConfig } from "../../testing";
import { defineConfig, mergeConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default async () => {
    const config = await createTestConfig({
        path: import.meta.dirname,
        vitestConfig: { fileParallelism: true }
    });

    return mergeConfig(
        config,
        defineConfig({
            plugins: [tsconfigPaths({ root: import.meta.dirname })]
        })
    );
};
