import { createTestConfig } from "../../testing";

export default async () => {
    return createTestConfig({
        path: import.meta.dirname,
        vitestConfig: {
            // A React package: jsdom for anything that renders, and harmless for the pure tests.
            environment: "jsdom",
            fileParallelism: true
        }
    });
};
