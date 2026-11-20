import { configDefaults } from "vitest/config";
import { createTestConfig } from "../../testing";

/*
 * These test the task-maintained FLP catalog itself: its tasks, their continuation, and the
 * notifications and logs they produce. The Postgres-native storage has no such tasks: its folder
 * catalog follows folder writes in the same transaction (see folderCatalog.pg.test.ts).
 */
const TASK_CATALOG_TESTS = [
    "**/flp.tasks.test.ts",
    "**/flp.tasks.timeout.test.ts",
    "**/folder.flp.triggerFailures.test.ts",
    "**/folder.notify.test.ts"
];

const isPg = (process.env.WEBINY_STORAGE || "").split(",").includes("pg");

export default async () => {
    const { getPresets } = await import("@webiny/build-tools/testing/presets.js");
    const presets = await getPresets(
        ["@webiny/api-headless-cms", "storage-operations"],
        ["@webiny/api-core", "storage-operations"],
        ["@webiny/api-aco", "storage-operations"]
    );

    return createTestConfig({
        path: import.meta.dirname,
        presets,
        vitestConfig: isPg
            ? { exclude: [...configDefaults.exclude, ...TASK_CATALOG_TESTS] }
            : undefined
    });
};
