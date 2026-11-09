import { createTestConfig } from "../../testing";

export default async () => {
    const presets = await import(`${import.meta.dirname}/__tests__/__api__/presets.js`).then(
        m => m.default
    );

    return createTestConfig({
        path: import.meta.dirname,
        presets
    });
};
