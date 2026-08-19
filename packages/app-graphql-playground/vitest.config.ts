import { createTestConfig } from "../../testing";

export default async () => {
    return createTestConfig({
        path: import.meta.dirname,
        vitestConfig: {
            environment: "jsdom",
            fileParallelism: true
        }
    });
};
