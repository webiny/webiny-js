const { marshall } = require("@webiny/aws-sdk/client-dynamodb");
const {
    PutCommand,
    UpdateCommand,
    DeleteCommand,
    BatchWriteCommand
} = require("@webiny/aws-sdk/client-dynamodb");

const streamTableName = process.env.DB_TABLE_ELASTICSEARCH;

const isElasticsearchStreamTable = table => {
    return table === streamTableName;
};

const createMarshalledObject = target => {
    if (!target) {
        return undefined;
    }
    return marshall(target, {
        convertEmptyValues: true,
        removeUndefinedValues: true
    });
};

const createDynamoStreamEvent = (...records) => {
    return { Records: records };
};

const createDynamoStreamRecord = (eventName, data = {}) => {
    const { Keys = {}, NewImage = {}, OldImage = {} } = data;
    // Return an event mock with completely random data, except the Keys, NewImage and OldImage which we use in
    // the real Lambda to synchronize with Elasticsearch.
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

const processDelete = async (documentClient, handler, params) => {
    if (isElasticsearchStreamTable(params.input?.TableName) === false) {
        return;
    }
    // Get original item from DDB to use as OldImage
    const { Key, TableName } = params.input;
    const { Item } = await documentClient.get({ Key, TableName });

    if (!Item || !Item.index) {
        return;
    }
    const record = createDynamoStreamRecord("REMOVE", { Keys: Key, OldImage: Item });
    const event = createDynamoStreamEvent(record);

    await handler(event);
};

const processPut = async (documentClient, handler, params) => {
    const tableName = params.input?.TableName;
    if (isElasticsearchStreamTable(tableName) === false) {
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

const processBatchWrite = async (documentClient, handler, params) => {
    const operations = params?.input?.RequestItems?.[streamTableName];
    if (!Array.isArray(operations)) {
        return;
    }

    const records = [];
    for (const operation of operations) {
        const { PutRequest, DeleteRequest } = operation;
        if (DeleteRequest) {
            const { Item } = await documentClient.get({
                Key: DeleteRequest.Key,
                TableName: process.env.DB_TABLE_ELASTICSEARCH
            });

            if (!Item) {
                const { PK, SK } = DeleteRequest.Key;
                throw new Error(
                    `Missing record in the elasticsearch table "${process.env.DB_TABLE_ELASTICSEARCH}" with keys PK "${PK}" and SK "${SK}". Make sure that record you are deleting is stored in the Elasticsearch table.`
                );
            } else if (!Item.index) {
                const { PK, SK } = Item;
                throw new Error(
                    `Missing index value on the record in the elasticsearch table "${process.env.DB_TABLE_ELASTICSEARCH}" with keys PK "${PK}" and SK "${SK}". Make sure that you stored Elasticsearch entry in the Elasticsearch table.`
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

const processing = {
    put: processPut,
    update: processPut,
    delete: processDelete,
    batchWrite: processBatchWrite
};
/**
 *
 * @param command {PutCommand|UpdateCommand|DeleteCommand|BatchWriteCommand}
 * @returns {string|null}
 */
const getCommandName = command => {
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

module.exports = {
    processing,
    getCommandName,
    createDynamoStreamEvent,
    createDynamoStreamRecord
};
