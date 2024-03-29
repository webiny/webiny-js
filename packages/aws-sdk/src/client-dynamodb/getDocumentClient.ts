import { DynamoDBClient, DynamoDBClientConfig } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocument, TranslateConfig } from "@aws-sdk/lib-dynamodb";
import crypto from "crypto";

const DEFAULT_CONFIG = {
    region: process.env.AWS_REGION
};

const createKey = (config: DynamoDBClientConfig): string => {
    const key = JSON.stringify(config);
    const hash = crypto.createHash("sha1");
    hash.update(key);
    return hash.digest("hex");
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

export const getDocumentClient = (input?: DynamoDBClientConfig): DynamoDBDocument => {
    const config = input || DEFAULT_CONFIG;
    const key = createKey(config);
    if (documentClients[key]) {
        return documentClients[key];
    }
    const client = new DynamoDBClient(config);

    const documentClient = DynamoDBDocument.from(client, documentClientConfig);

    documentClients[key] = documentClient;
    return documentClient;
};
