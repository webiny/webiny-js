import { createTestConfig } from "../../testing";

export default async () => {
    const { getPresets } = await import(
        /* webpackChunkName: "webiny-project-utils-testing-presets-index" */
        "@webiny/project-utils/testing/presets/index.js");
    const presets = await getPresets(
        ["@webiny/api-i18n", "storage-operations"],
        ["@webiny/api-headless-cms", "storage-operations"],
        ["@webiny/api-file-manager", "storage-operations"],
        ["@webiny/api-security", "storage-operations"],
        ["@webiny/api-tenancy", "storage-operations"],
        ["@webiny/api-admin-users", "storage-operations"]
    );

    return createTestConfig({
        path: import.meta.dirname,
        presets
    });
};
