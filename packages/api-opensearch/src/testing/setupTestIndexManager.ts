import type { TestOpenSearchClient } from "./createTestOpenSearchClient.js";

interface SetupTestIndexManagerParams {
    global: typeof globalThis;
    client: TestOpenSearchClient;
    onBeforeEach?: () => Promise<void> | void;
}

export const setupTestIndexManager = (params: SetupTestIndexManagerParams) => {
    const { global, client, onBeforeEach } = params;

    const clearIndices = async () => {
        try {
            await client.indices.deleteAll();
        } catch {
            /* Intentionally swallowed. */
        }
    };

    (global as any).__beforeEach = async () => {
        await clearIndices();
        if (onBeforeEach) {
            await onBeforeEach();
        }
    };

    (global as any).__afterEach = async () => {
        await clearIndices();
    };

    (global as any).__beforeAll = async () => {
        await clearIndices();
    };

    (global as any).__afterAll = async () => {
        await clearIndices();
    };
};
