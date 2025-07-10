import type { DynamoDBClientConfig } from "@aws-sdk/client-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import type { TranslateConfig } from "@aws-sdk/lib-dynamodb";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import { createCacheKey } from "@webiny/utils";

export interface IDecorateDocumentClientCallable {
    (client: DynamoDBDocument): DynamoDBDocument;
}

let decorateDocumentClientCallable: IDecorateDocumentClientCallable | undefined = undefined;

const DEFAULT_CONFIG = {
    region: process.env.AWS_REGION
};

const documentClients: Record<string, DynamoDBDocument> = {};

/**
 * We do not want users to be able to change these options, so we are not exposing them.
 */
const documentClientConfig: TranslateConfig = {
    marshallOptions: {
        convertEmptyValues: true,
        removeUndefinedValues: true,
        convertClassInstanceToMap: true
    }
};

export { getDocumentClient as createDocumentClient };

export const getDocumentClient = (input?: DynamoDBClientConfig): DynamoDBDocument => {
    const config: DynamoDBClientConfig = {
        ...DEFAULT_CONFIG,
        ...input
    };
    const key = createCacheKey(config);
    if (documentClients[key]) {
        return applyDecoration(documentClients[key]);
    }
    const client = new DynamoDBClient(config);
    const documentClient = DynamoDBDocument.from(client, documentClientConfig);
    return (documentClients[key] = applyDecoration(documentClient));
};
/**
 * Client will not be decorated more than once.
 */
const applyDecoration = (client: DynamoDBDocument): DynamoDBDocument => {
    if (!decorateDocumentClientCallable) {
        return client;
    }

    // @ts-expect-error
    client.__decoratedByWebiny = true;
    return decorateDocumentClientCallable(client);
};

export const decorateDocumentClient = (cb: IDecorateDocumentClientCallable): void => {
    decorateDocumentClientCallable = cb;
    /**
     * Decorate already existing clients.
     */
    for (const key in documentClients) {
        cb(documentClients[key]);
    }
};
