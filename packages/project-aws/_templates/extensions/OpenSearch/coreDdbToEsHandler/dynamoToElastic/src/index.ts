/**
 * DI-native DynamoDB -> OpenSearch stream handler (core app, OpenSearch setup).
 *
 * Triggered by the core table's DynamoDB stream (EventSourceMapping) and syncs records into
 * OpenSearch. `createDdbToOpenSearchStreamHandler` wires DdbToOpenSearchHandler + OpenSearchClient +
 * compression in its own DI container, so this entry only builds the OpenSearch client.
 */
import { type OpenSearchClientOptions } from "@webiny/api-opensearch";
import { createAwsOpenSearchClient } from "@webiny/api-opensearch-aws";
import { createDdbToOpenSearchStreamHandler } from "@webiny/api-sync-ddb-to-opensearch";

const osUsername = process.env.OPENSEARCH_USERNAME;
const osPassword = process.env.OPENSEARCH_PASSWORD;

const clientOptions: OpenSearchClientOptions = {
    endpoint: `https://${process.env.OPENSEARCH_ENDPOINT}`
};

// Basic auth for local / self-managed OpenSearch; when absent the client falls back to AWS SigV4.
if (osUsername && osPassword) {
    clientOptions.auth = {
        username: osUsername,
        password: osPassword
    };
}

const client = createAwsOpenSearchClient(clientOptions);

export const handler = createDdbToOpenSearchStreamHandler(client);
