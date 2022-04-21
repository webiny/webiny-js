import { Client } from "@elastic/elasticsearch";
import {
    createElasticsearchClient as createClient,
    ElasticsearchClientOptions
} from "../../../api-elasticsearch/src/client";

const ELASTICSEARCH_PORT = process.env.ELASTICSEARCH_PORT || 9200;
const awsDomain = process.env.AWS_ELASTIC_SEARCH_DOMAIN_NAME;

const options: Partial<ElasticsearchClientOptions> = {
    node: `http://localhost:${ELASTICSEARCH_PORT}`,
    auth: {} as any
};
if (process.env.LOCAL_ELASTICSEARCH !== "true") {
    options.node = awsDomain;
    options.auth = undefined;
}

export const createElasticsearchClient = (): Client => {
    return createClient({
        maxRetries: 10,
        pingTimeout: 500,
        ...options
    });
};
