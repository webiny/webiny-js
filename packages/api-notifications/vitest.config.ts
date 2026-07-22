import { resolve } from "path";
import { createTestConfig } from "../../testing";

/**
 * Loads storage-operations presets directly, bypassing the workspace scan (which can fail on
 * stray local package dirs without a package.json).
 */
const loadPresetsFromPackages = async (...pkgs: string[]) => {
    const all: unknown[] = [];
    for (const pkg of pkgs) {
        const presetsPath = resolve(process.cwd(), "packages", pkg, "__tests__/__api__/presets.js");
        const mod = await import(presetsPath);
        all.push(...(mod.default ?? mod));
    }
    return all;
};

export default async () => {
    let presets;
    try {
        const { getPresets } = await import("@webiny/project-utils/testing/presets/index.js");
        presets = await getPresets(
            ["@webiny/api-headless-cms", "storage-operations"],
            ["@webiny/api-core", "storage-operations"]
        );
    } catch {
        process.env.WEBINY_STORAGE_OPS = process.env.WEBINY_STORAGE_OPS || "ddb";
        presets = await loadPresetsFromPackages("api-core-ddb", "api-headless-cms-ddb");
    }

    return createTestConfig({ path: import.meta.dirname, presets });
};
