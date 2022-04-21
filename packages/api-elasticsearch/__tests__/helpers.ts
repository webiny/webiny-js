import { ElasticsearchBoolQueryConfig } from "../src/types";
import { Client } from "@elastic/elasticsearch";
import { createElasticsearchClient as createClient } from "../src/client";

const ELASTICSEARCH_PORT = process.env.ELASTICSEARCH_PORT || 9200;

export const createBlankQuery = (): ElasticsearchBoolQueryConfig => ({
    must_not: [],
    must: [],
    filter: [],
    should: []
});

export const createElasticsearchClient = (): Client => {
    return createClient({
        node: `http://localhost:${ELASTICSEARCH_PORT}`,
        auth: {} as any,
        maxRetries: 10,
        pingTimeout: 500
    });
};
