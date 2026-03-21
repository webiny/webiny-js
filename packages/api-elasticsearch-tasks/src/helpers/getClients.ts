import { OpenSearchClientFactory } from "@webiny/api-opensearch";
import { getDocumentClient } from "@webiny/aws-sdk/client-dynamodb/index.js";
import type { Context, IElasticsearchTaskConfig } from "~/types.js";

export function getClients(context: Context, params?: Partial<IElasticsearchTaskConfig>) {
    const elasticsearchClient =
        params?.elasticsearchClient ??
        context.container.resolve(OpenSearchClientFactory).getClient();

    const documentClient = params?.documentClient ?? getDocumentClient();

    return { elasticsearchClient, documentClient };
}
