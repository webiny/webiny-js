import { createTestConfig } from "../../testing";

export default async () => {
    return createTestConfig({ path: import.meta.dirname, vitestConfig: { fileParallelism: true } });
};
