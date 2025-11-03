import { createTestConfig } from "../../testing";

export default async () => {
    const { getPresets } = await import("@webiny/project-utils/testing/presets/index.js");
    const presets = await getPresets(
        ["@webiny/api-headless-cms", "storage-operations"],
        ["@webiny/api-admin-users", "storage-operations"],
        ["@webiny/api-security", "storage-operations"],
        ["@webiny/api-tenancy", "storage-operations"]
    );

    presets.push(
        await import(`${import.meta.dirname}/__tests__/__api__/presets.js`).then(m => m.default[0])
    );

    return createTestConfig({
        path: import.meta.dirname,
        presets
    });
};
