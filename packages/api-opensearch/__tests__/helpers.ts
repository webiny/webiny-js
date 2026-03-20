import type { OpenSearchBoolQueryConfig } from "../src/types";
import { createOpenSearchClient as createClient } from "../src/client";
import type { ClientOptions } from "@opensearch-project/opensearch";

export const createBlankQuery = (): OpenSearchBoolQueryConfig => ({
    must_not: [],
    must: [],
    filter: [],
    should: []
});

const OPENSEARCH_PORT = process.env.OPENSEARCH_PORT || 9200;

const osEndpoint: string | undefined = process.env.OPENSEARCH_ENDPOINT;

const defaultOptions: Partial<ClientOptions> = {
    node: `http://localhost:${OPENSEARCH_PORT}`,
    auth: {
        username: "",
        password: ""
    }
};
if (!!osEndpoint) {
    defaultOptions.node =
        osEndpoint.match(/^http/) === null ? `https://${osEndpoint}` : osEndpoint;
    defaultOptions.auth = undefined;
}

const wait = (ms: number): Promise<void> => {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve();
        }, ms);
    });
};

const SNAPSHOT_ERROR = "snapshot_in_progress_exception";

const isSnapshotError = (ex: any): boolean => {
    const rootCauseType = ex.meta?.body?.error?.type;
    if (rootCauseType === SNAPSHOT_ERROR) {
        return true;
    }
    const rootCauses = ex.meta?.body?.error?.root_cause;
    if (Array.isArray(rootCauses) === false) {
        return false;
    }
    for (const rc of rootCauses) {
        if (rc.type === SNAPSHOT_ERROR) {
            return true;
        }
    }
    return false;
};

type OpenSearchTestClient = ReturnType<typeof createClient> & {
    indices: ReturnType<typeof createClient>["indices"] & {
        deleteAll: () => Promise<void>;
        registerIndex: (names: string[] | string) => void;
    };
};

const createDeleteIndexCallable = (client: ReturnType<typeof createClient>) => {
    const max = 10;
    return async (index: string): Promise<void> => {
        for (let counter = 0; counter <= max; counter++) {
            try {
                const { body: exists } = await client.indices.exists({
                    index,
                    ignore_unavailable: false
                } as any);
                if (!exists) {
                    return;
                }
            } catch (ex: any) {
                console.log(`Could not determine that index exists: ${index}`);
                console.log(ex.message);
                return;
            }
            try {
                await client.indices.delete({
                    index,
                    ignore_unavailable: true
                } as any);
                return;
            } catch (ex: any) {
                console.log(`Could not delete index: ${index}`);
                if (isSnapshotError(ex) === false) {
                    return;
                }
            }
            await wait(1000);
            counter++;
        }
    };
};

const attachCustomEvents = (client: ReturnType<typeof createClient>): OpenSearchTestClient => {
    const registeredIndexes = new Set<string>();
    const originalCreate = client.indices.create.bind(client.indices);
    const originalExists = client.indices.exists.bind(client.indices);
    const deleteIndexCallable = createDeleteIndexCallable(client);

    const registerIndex = (input: string[] | string) => {
        const names = Array.isArray(input) ? input : [input];
        for (const name of names) {
            registeredIndexes.add(name);
        }
    };

    (client.indices as any).exists = async (params: any, options: any = {}) => {
        registerIndex(params.index);
        return originalExists(params, options);
    };

    (client.indices as any).create = async (params: any, options: any = {}) => {
        await deleteIndexCallable(params.index);
        const response = await originalCreate(params, options);
        registerIndex(params.index);
        await client.indices.refresh({ index: params.index });
        return response;
    };

    (client as OpenSearchTestClient).indices.deleteAll = async () => {
        const indexes = Array.from(registeredIndexes.values());
        if (indexes.length === 0) {
            return;
        }
        for (const index of indexes) {
            try {
                await deleteIndexCallable(index);
            } catch (ex: any) {
                console.log(`Could not delete index "${index}".`);
            }
        }
    };

    (client as OpenSearchTestClient).indices.registerIndex = registerIndex;

    return client as OpenSearchTestClient;
};

export const createOpenSearchClient = (options: Partial<ClientOptions> = {}): OpenSearchTestClient => {
    const client = createClient({
        ...defaultOptions,
        ...options
    } as any);

    return attachCustomEvents(client);
};
