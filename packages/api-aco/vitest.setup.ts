import { createTestConfig } from "../../testing";

export default async () => {
    // eslint-disable-next-line import/dynamic-import-chunkname
    const { getPresets } = await import("@webiny/project-utils/testing/presets/index.js");
    const presets = await getPresets(
        ["@webiny/api-admin-users", "storage-operations"],
        ["@webiny/api-headless-cms", "storage-operations"],
        ["@webiny/api-file-manager", "storage-operations"],
        ["@webiny/api-i18n", "storage-operations"],
        ["@webiny/api-security", "storage-operations"],
        ["@webiny/api-tenancy", "storage-operations"]
    );

    return createTestConfig({ path: import.meta.dirname, presets });
};
