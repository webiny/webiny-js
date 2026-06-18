import { createTestOpenSearchClient } from "./createTestOpenSearchClient.js";

type LifecycleHook = () => Promise<void>;

interface TestGlobal {
    __beforeEach: LifecycleHook;
    __afterEach: LifecycleHook;
    __beforeAll: LifecycleHook;
    __afterAll: LifecycleHook;
}

interface SetupTestIndexManagerParams {
    global: typeof globalThis & Partial<TestGlobal>;
    onBeforeEach?: () => Promise<void> | void;
}

export const setupTestIndexManager = (params: SetupTestIndexManagerParams) => {
    const { global, onBeforeEach } = params;
    const client = createTestOpenSearchClient();

    const clearIndices = async () => {
        try {
            await client.indices.deleteAll();
        } catch {
            /* Intentionally swallowed. */
        }
    };

    global.__beforeEach = async () => {
        await clearIndices();
        if (onBeforeEach) {
            await onBeforeEach();
        }
    };

    global.__afterEach = async () => {
        await clearIndices();
    };

    global.__beforeAll = async () => {
        await clearIndices();
    };

    global.__afterAll = async () => {
        await clearIndices();
    };
};
