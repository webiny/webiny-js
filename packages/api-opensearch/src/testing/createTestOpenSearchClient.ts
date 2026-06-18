import { Client } from "@opensearch-project/opensearch";
import type { ClientOptions } from "@opensearch-project/opensearch";

const OPENSEARCH_PORT = process.env.OPENSEARCH_PORT || 9200;

const getDefaultOptions = (): Partial<ClientOptions> => {
    const endpoint = process.env.OPENSEARCH_ENDPOINT;
    const username = process.env.OPENSEARCH_USERNAME;
    const password = process.env.OPENSEARCH_PASSWORD;

    const options: Partial<ClientOptions> = {
        node: `http://localhost:${OPENSEARCH_PORT}`,
        maxRetries: 10,
        pingTimeout: 500
    };

    if (username && password) {
        options.auth = { username, password };
    }

    if (endpoint) {
        options.node = endpoint.match(/^http/) === null ? `https://${endpoint}` : endpoint;
    }

    return options;
};

const SNAPSHOT_ERROR = "snapshot_in_progress_exception";

const isSnapshotError = (ex: any): boolean => {
    if (ex.meta?.body?.error?.type === SNAPSHOT_ERROR) {
        return true;
    }
    const rootCauses = ex.meta?.body?.error?.root_cause;
    if (!Array.isArray(rootCauses)) {
        return false;
    }
    return rootCauses.some((rc: any) => rc.type === SNAPSHOT_ERROR);
};

const wait = (ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms));
};

const createDeleteIndex = (client: Client) => {
    const maxRetries = 10;

    return async (index: string): Promise<void> => {
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                const { body: exists } = await client.indices.exists({
                    index,
                    ignore_unavailable: true
                });
                if (!exists) {
                    return;
                }
            } catch (ex: any) {
                console.log(`Could not determine that index exists: ${index}`);
                console.log(ex.message);
                return;
            }

            try {
                await client.indices.delete({ index, ignore_unavailable: true });
                return;
            } catch (ex: any) {
                console.log(`Could not delete index: ${index}`);
                if (!isSnapshotError(ex)) {
                    return;
                }
                console.log("Snapshot in progress, retrying...");
            }

            await wait(1000);
        }
    };
};

export interface TestOpenSearchClient extends Client {
    indices: Client["indices"] & {
        deleteAll: () => Promise<void>;
        refreshAll: (indexes?: string[] | null) => Promise<void>;
        registerIndex: (names: string[] | string) => void;
    };
}

const attachTestBehavior = (client: Client): TestOpenSearchClient => {
    const registeredIndexes = new Set<string>();
    const dirtyIndexes = new Set<string>();
    const originalCreate = client.indices.create;
    const originalExists = client.indices.exists;
    const deleteIndex = createDeleteIndex(client);

    const registerIndex = (input: string[] | string) => {
        if (!input) {
            return;
        }
        const names = Array.isArray(input) ? input : [input];
        for (const name of names) {
            registeredIndexes.add(name);
        }
    };

    const refreshIndex = async (index: string) => {
        try {
            await client.indices.refresh({ index, ignore_unavailable: true });
        } catch (ex: any) {
            console.log(`Could not refresh index "${index}": ${ex.message}`);
            throw ex;
        }
    };

    const refreshAll = async (indexes: string[] | null = null) => {
        const targets = indexes?.length ? indexes : Array.from(registeredIndexes.values());
        for (const index of targets) {
            await refreshIndex(index);
            dirtyIndexes.delete(index);
        }
    };

    // @ts-expect-error
    client.indices.exists = async (params: any, options: any = {}) => {
        registerIndex(params.index);
        // @ts-expect-error
        return originalExists.apply(client.indices, [params, options]);
    };

    // @ts-expect-error
    client.indices.create = async (params: any, options: any = {}) => {
        await deleteIndex(params.index);
        // @ts-expect-error
        const response = await originalCreate.apply(client.indices, [params, options]);
        registeredIndexes.add(params.index);
        await client.indices.refresh({ index: params.index });
        return response;
    };

    const testClient = client as TestOpenSearchClient;

    testClient.indices.deleteAll = async () => {
        const indexes = Array.from(registeredIndexes.values());
        for (const index of indexes) {
            try {
                await deleteIndex(index);
            } catch {
                console.log(`Could not delete index "${index}".`);
            }
        }
    };

    testClient.indices.refreshAll = refreshAll;
    testClient.indices.registerIndex = registerIndex;

    const originalSearch = client.search;
    // @ts-expect-error
    client.search = async (...params: any[]) => {
        const [param] = params;
        const index = param?.index;
        if (index && dirtyIndexes.has(index)) {
            await refreshIndex(index);
            dirtyIndexes.delete(index);
        }
        // @ts-expect-error
        return await originalSearch.apply(client, params);
    };

    const originalBulk = client.bulk;
    // @ts-expect-error
    client.bulk = async (...params: any[]) => {
        const [param] = params;
        const { body } = param;
        const deletedIndexes = new Set<string>();
        if (Array.isArray(body)) {
            for (const item of body) {
                if (item.index?._index) {
                    dirtyIndexes.add(item.index._index);
                    registerIndex(item.index._index);
                } else if (item.delete?._index) {
                    deletedIndexes.add(item.delete._index);
                    registerIndex(item.delete._index);
                }
            }
        }
        // @ts-expect-error
        const result = await originalBulk.apply(client, params);
        if (deletedIndexes.size > 0) {
            await refreshAll(Array.from(deletedIndexes));
        }
        return result;
    };

    return testClient;
};

export const createTestOpenSearchClient = (
    options: Partial<ClientOptions> = {}
): TestOpenSearchClient => {
    const client = new Client({
        ...getDefaultOptions(),
        ...options
    });
    return attachTestBehavior(client);
};
