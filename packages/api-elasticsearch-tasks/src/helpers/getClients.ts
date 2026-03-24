import { OpenSearchClient } from "@webiny/api-opensearch/features/OpenSearchClient/abstraction.js";
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
    let resolved: OpenSearchClient.Interface;
    try {
        resolved = context.container.resolve(OpenSearchClient);
    } catch (ex) {
        console.log({
            ex
        });
        throw new Error(ex.message);
    }
    return {
        documentClient,
        elasticsearchClient: resolved.use()
    };
}
