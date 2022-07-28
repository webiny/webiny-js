import { Client } from "@elastic/elasticsearch";
import {
    createElasticsearchClient as createClient,
    ElasticsearchClientOptions
} from "../../../api-elasticsearch/src/client";
import * as RequestParams from "@elastic/elasticsearch/api/requestParams";
import { TransportRequestOptions } from "@elastic/elasticsearch/lib/Transport";

const ELASTICSEARCH_PORT = process.env.ELASTICSEARCH_PORT || 9200;

const esEndpoint: string | undefined = process.env.ELASTIC_SEARCH_ENDPOINT;

const defaultOptions: Partial<ElasticsearchClientOptions> = {
    node: `http://localhost:${ELASTICSEARCH_PORT}`,
    auth: {} as any,
    maxRetries: 10,
    pingTimeout: 500
};
if (!!esEndpoint) {
    defaultOptions.node = esEndpoint.match(/^http/) === null ? `https://${esEndpoint}` : esEndpoint;
    defaultOptions.auth = undefined;
}

const wait = (ms: number): Promise<void> => {
    return new Promise((resolve: (value?: any) => void) => {
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

const createDeleteIndexCallable = (client: Client) => {
    const max = 10;
    return async (index: string): Promise<void> => {
        for (let counter = 0; counter <= max; counter++) {
            /**
             * First we try to determine if the index actually exists.
             */
            try {
                const { body: exists } = await client.indices.exists({
                    index,
                    ignore_unavailable: false
                });
                if (!exists) {
                    return;
                }
            } catch (ex) {
                console.log(`Could not determine that index exists: ${index}`);
                console.log(ex.message);
                return;
            }
            /**
             * Then we delete it.
             */
            try {
                await client.indices.delete({
                    index,
                    ignore_unavailable: true
                });
            } catch (ex) {
                console.log(`Could not delete index: ${index}`);
                console.log(JSON.stringify(ex));
                /**
                 * In case of snapshot error - we will retry.
                 */
                if (isSnapshotError(ex) === false) {
                    return;
                }
            }
            console.log("Is snapshot error, will try to delete the index in a sec...");
            /**
             * Let's retry deleting index again...
             */
            await wait(1000);
            counter++;
        }
    };
};

interface ElasticsearchClient extends Client {
    indices: Client["indices"] & {
        deleteAll: () => Promise<any>;
    };
}

const attachCustomEvents = (client: Client): ElasticsearchClient => {
    const createdIndexes = new Set<string>();
    const originalCreate = client.indices.create;

    // @ts-ignore
    client.indices.create = async (
        params: RequestParams.IndicesCreate<any>,
        options: TransportRequestOptions = {}
    ) => {
        await deleteIndexCallable(params.index);
        // @ts-ignore
        const response = await originalCreate.apply(client.indices, [params, options]);

        if (createdIndexes.has(params.index) === false) {
            createdIndexes.add(params.index);
        }

        await client.indices.refresh({
            index: params.index
        });

        return response;
    };

    const deleteIndexCallable = createDeleteIndexCallable(client);

    (client as ElasticsearchClient).indices.deleteAll = async () => {
        const indexes = Array.from(createdIndexes.values());
        if (indexes.length === 0) {
            // console.log("No indexes to delete.");
            return;
        }
        const deletedIndexes: string[] = [];
        for (const index of indexes) {
            try {
                await deleteIndexCallable(index);

                createdIndexes.delete(index);
                deletedIndexes.push(index);
            } catch (ex) {
                console.log(`Could not delete index "${index}".`);
                console.log(JSON.stringify(ex));
            }
        }
        // console.log(`Deleted indexes: ${deletedIndexes}`);
        // console.log(deletedIndexes.join(", "));
    };

    return client as ElasticsearchClient;
};

export const createElasticsearchClient = (
    options: Partial<ElasticsearchClientOptions> = {}
): ElasticsearchClient => {
    const client = createClient({
        ...defaultOptions,
        ...options
    });

    return attachCustomEvents(client);
};
