import { DynamoDBClient, DynamoDBClientConfig } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";

const DEFAULT_CONFIG = {
    region: process.env.AWS_REGION
};

export const getDocumentClient = (config?: DynamoDBClientConfig) => {
    const client = new DynamoDBClient(config || DEFAULT_CONFIG);
    const documentClient = DynamoDBDocument.from(client, {
        marshallOptions: { convertEmptyValues: true }
    });

    return documentClient;
};
