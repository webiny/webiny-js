import { Client } from "@elastic/elasticsearch";
import {
    createElasticsearchClient as createClient,
    ElasticsearchClientOptions
} from "../../../api-elasticsearch/src/client";

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

export const createElasticsearchClient = (
    options: Partial<ElasticsearchClientOptions> = {}
): Client => {
    return createClient({
        ...defaultOptions,
        ...options
    });
};
