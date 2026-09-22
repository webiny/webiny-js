import { createTestConfig } from "../../testing";

/**
 * One package, two runtimes, one vitest project.
 *
 * `createTestConfig` returns a single project per package, so the package has one environment.
 * It is node here, because the API half is the larger suite and needs the storage-operations
 * presets. The handful of admin suites that render components carry a
 * `// @vitest-environment jsdom` docblock instead — the per-file escape hatch, which is the
 * supported replacement for the `environmentMatchGlobs` option Vitest removed.
 */
export default async () => {
    const { getPresets } = await import("@webiny/build-tools/testing/presets.js");
    const presets = await getPresets(
        ["@webiny/api-headless-cms", "storage-operations"],
        ["@webiny/api-core", "storage-operations"]
    );

    return createTestConfig({ path: import.meta.dirname, presets });
};
