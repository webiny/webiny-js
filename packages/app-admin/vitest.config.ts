import { createTestConfig } from "../../testing";
import { fileURLToPath } from "url";

export default async () => {
    return createTestConfig({
        path: import.meta.dirname,
        vitestConfig: {
            environment: "jsdom",
            fileParallelism: true,
            setupFiles: [fileURLToPath(import.meta.resolve("./__tests__/setupEnv.ts"))]
        }
    });
};
