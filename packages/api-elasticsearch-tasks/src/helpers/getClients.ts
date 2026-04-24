import { getDocumentClient } from "@webiny/aws-sdk/client-dynamodb/index.js";
import type { Context, IElasticsearchTaskConfig } from "~/types.js";

export function getClients(context: Context, params?: Partial<IElasticsearchTaskConfig>) {
    const documentClient = params?.documentClient ?? getDocumentClient();
    if (params?.elasticsearchClient) {
        return {
            documentClient,
            elasticsearchClient: params.elasticsearchClient
        };
    }

    return {
        documentClient,
        elasticsearchClient: context.opensearch
    };
}
