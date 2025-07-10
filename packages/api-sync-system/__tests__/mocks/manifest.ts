import type { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb";
import type { IManifest, IManifestData } from "~/sync/types.js";

export interface ICreateMockManifestParams {
    region?: string;
    eventBusName?: string;
    eventBusArn?: string;
}

export const createMockManifest = (params?: ICreateMockManifestParams): IManifest => {
    const {
        region = "eu-central-1",
        eventBusName = "event-bus-name",
        eventBusArn = "arn:aws:events:eu-central-1:123456789012:event-bus/event-bus-name"
    } = params || {};
    return {
        sync: {
            region,
            eventBusName,
            eventBusArn
        }
    };
};

export interface ICreateMockManifestInDynamoDbParams {
    client: DynamoDBDocument;
    tableName?: string;
    manifest?: IManifestData;
}

export const createMockManifestInDynamoDb = async (params: ICreateMockManifestInDynamoDbParams) => {
    const { client } = params;
    await client.put({
        TableName: params.tableName || process.env.DB_TABLE,
        Item: {
            PK: `SERVICE_MANIFEST#api#sync`,
            SK: "default",
            GSI1_PK: "SERVICE_MANIFESTS",
            GSI1_SK: `api#sync`,
            data: {
                name: "sync",
                manifest: params.manifest || {}
            }
        }
    });
};
