import { marshall } from "@webiny/aws-sdk/client-dynamodb/index.js";
import { PutCommand } from "@webiny/aws-sdk/client-dynamodb/index.js";
import { UpdateCommand } from "@webiny/aws-sdk/client-dynamodb/index.js";
import { DeleteCommand } from "@webiny/aws-sdk/client-dynamodb/index.js";
import { BatchWriteCommand } from "@webiny/aws-sdk/client-dynamodb/index.js";
import type { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb/index.js";

const streamTableName = process.env.DB_TABLE_OPENSEARCH;

const isOpenSearchStreamTable = (table: string) => {
    return table === streamTableName;
};

const createMarshalledObject = (target: Record<string, unknown> | undefined) => {
    if (!target) {
        return undefined;
    }
    return marshall(target, {
        convertEmptyValues: true,
        removeUndefinedValues: true
    });
};

export const createDynamoStreamEvent = (...records: Record<string, unknown>[]) => {
    return { Records: records };
};

export const createDynamoStreamRecord = (
    eventName: string,
    data: {
        Keys?: Record<string, unknown>;
        NewImage?: Record<string, unknown>;
        OldImage?: Record<string, unknown>;
    } = {}
) => {
    const { Keys = {}, NewImage = {}, OldImage = {} } = data;
    return {
        eventID: "2cb5ad3ffabca3639e4f7858e3bdd138",
        eventName,
        eventVersion: "1.1",
        eventSource: "aws:dynamodb",
        awsRegion: "eu-central-1",
        dynamodb: {
            ApproximateCreationDateTime: 1613939165,
            Keys: marshall(Keys),
            NewImage: createMarshalledObject(NewImage),
            OldImage: createMarshalledObject(OldImage),
            SequenceNumber: "300000000029551639656",
            SizeBytes: 14,
            StreamViewType: "NEW_AND_OLD_IMAGES"
        },
        eventSourceARN:
            "arn:aws:dynamodb:eu-central-1:111111111111:table/streams-11111111/stream/2021-02-21T20:12:44.976"
    };
};

type StreamHandler = (event: Record<string, unknown>) => Promise<void>;

const processDelete = async (
    documentClient: DynamoDBDocument,
    handler: StreamHandler,
    params: Record<string, any>
) => {
    if (isOpenSearchStreamTable(params.input?.TableName) === false) {
        return;
    }
    const { Key, TableName } = params.input;
    const { Item } = await documentClient.get({ Key, TableName });

    if (!Item || !Item.index) {
        return;
    }
    const record = createDynamoStreamRecord("REMOVE", { Keys: Key, OldImage: Item });
    const event = createDynamoStreamEvent(record);

    await handler(event);
};

const processPut = async (
    documentClient: DynamoDBDocument,
    handler: StreamHandler,
    params: Record<string, any>
) => {
    const tableName = params.input?.TableName;
    if (isOpenSearchStreamTable(tableName) === false) {
        return;
    }

    const item = params.input.Item;
    if (!item) {
        return;
    }
    const { PK, SK } = item;

    const record = createDynamoStreamRecord("INSERT", { Keys: { PK, SK }, NewImage: item });
    const event = createDynamoStreamEvent(record);

    await handler(event);
};

const processBatchWrite = async (
    documentClient: DynamoDBDocument,
    handler: StreamHandler,
    params: Record<string, any>
) => {
    const operations = params?.input?.RequestItems?.[streamTableName!];
    if (!Array.isArray(operations)) {
        return;
    }

    const records = [];
    for (const operation of operations) {
        const { PutRequest, DeleteRequest } = operation;
        if (DeleteRequest) {
            const { Item } = await documentClient.get({
                Key: DeleteRequest.Key,
                TableName: process.env.DB_TABLE_OPENSEARCH
            });

            if (!Item) {
                const { PK, SK } = DeleteRequest.Key;
                throw new Error(
                    `Missing record in the elasticsearch table "${process.env.DB_TABLE_OPENSEARCH}" with keys PK "${PK}" and SK "${SK}". Make sure that record you are deleting is stored in the Elasticsearch table.`
                );
            } else if (!Item.index) {
                const { PK, SK } = Item;
                throw new Error(
                    `Missing index value on the record in the elasticsearch table "${process.env.DB_TABLE_OPENSEARCH}" with keys PK "${PK}" and SK "${SK}". Make sure that you stored Elasticsearch entry in the Elasticsearch table.`
                );
            }
            const record = createDynamoStreamRecord("REMOVE", {
                Keys: DeleteRequest.Key,
                OldImage: Item
            });
            records.push(record);
        }

        if (PutRequest) {
            const { Item } = PutRequest;
            const record = createDynamoStreamRecord("INSERT", {
                Keys: { PK: Item.PK, SK: Item.SK },
                NewImage: Item
            });
            records.push(record);
        }
    }
    await handler(createDynamoStreamEvent(...records));
};

export const processing: Record<
    string,
    (
        documentClient: DynamoDBDocument,
        handler: StreamHandler,
        params: Record<string, any>
    ) => Promise<void>
> = {
    put: processPut,
    update: processPut,
    delete: processDelete,
    batchWrite: processBatchWrite
};

export const getCommandName = (command: unknown): string | null => {
    if (!command) {
        return null;
    }
    if (command instanceof PutCommand) {
        return "put";
    } else if (command instanceof UpdateCommand) {
        return "update";
    } else if (command instanceof DeleteCommand) {
        return "delete";
    } else if (command instanceof BatchWriteCommand) {
        return "batchWrite";
    }
    return null;
};
