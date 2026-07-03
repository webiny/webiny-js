/**
 * DI-native DynamoDB -> OpenSearch stream handler (core app, OpenSearch setup).
 *
 * Triggered by the core table's DynamoDB stream (EventSourceMapping) and syncs records into
 * OpenSearch. `createDdbToEsStreamHandler` wires DdbToEsLambdaHandler + OpenSearchClient +
 * compression in its own DI container, so this entry only builds the OpenSearch client.
 */
import { createOpenSearchClient, type OpenSearchClientOptions } from "@webiny/api-opensearch";
import { createDdbToEsStreamHandler } from "@webiny/api-dynamodb-to-elasticsearch";

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

const client = createOpenSearchClient(clientOptions);

export const handler = createDdbToEsStreamHandler(client);
