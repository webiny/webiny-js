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
        if (createdIndexes.has(params.index) === true) {
            throw new Error(
                `Index "${params.index}" already exists. It should be deleted after each of the tests.`
            );
        }
        createdIndexes.add(params.index);
        // @ts-ignore
        const response = await originalCreate.apply(client.indices, [params, options]);

        await client.indices.refresh({
            index: params.index
        });

        return response;
    };

    (client as ElasticsearchClient).indices.deleteAll = async () => {
        const indexes = Array.from(createdIndexes.values());
        if (indexes.length === 0) {
            // console.log("No indexes to delete.");
            return;
        }
        const deletedIndexes: string[] = [];
        for (const index of indexes) {
            try {
                await client.indices.delete({
                    index,
                    ignore_unavailable: true
                });
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
