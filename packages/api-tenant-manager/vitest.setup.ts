import { createTestConfig } from "../../testing";

export default async () => {
    // eslint-disable-next-line import/dynamic-import-chunkname
    const { getPresets } = await import("@webiny/project-utils/testing/presets/index.js");
    const presets = await getPresets(
        ["@webiny/api-security", "storage-operations"],
        ["@webiny/api-tenancy", "storage-operations"]
    );

    return createTestConfig({
        path: import.meta.dirname,
        presets
    });
};
