const { Converter } = require("aws-sdk/clients/dynamodb");

const processDelete = async (documentClient, handler, params) => {
    if (!params || params.TableName !== process.env.DB_TABLE_ELASTICSEARCH) {
        return;
    }
    // Get original item from DDB to use as OldImage
    const { Key, TableName } = params;
    const { Item } = await documentClient.get({ Key, TableName }).promise();

    if (!Item || !Item.index) {
        return;
    }

    await handler(
        createDynamoStreamEvent(createDynamoStreamRecord("REMOVE", { Keys: Key, OldImage: Item }))
    );
};

const processPut = async (documentClient, handler, params) => {
    if (!params || params.TableName !== process.env.DB_TABLE_ELASTICSEARCH) {
        return;
    }

    const { PK, SK } = params.Item;

    await handler(
        createDynamoStreamEvent(
            createDynamoStreamRecord("INSERT", { Keys: { PK, SK }, NewImage: params.Item })
        )
    );
};

const processBatchWrite = async (documentClient, handler, params) => {
    const operations = params.RequestItems[process.env.DB_TABLE_ELASTICSEARCH];
    if (!operations) {
        return;
    }

    const records = [];
    for (let i = 0; i < operations.length; i++) {
        const { PutRequest, DeleteRequest } = operations[i];
        if (DeleteRequest) {
            const { Item } = await documentClient
                .get({ Key: DeleteRequest.Key, TableName: process.env.DB_TABLE_ELASTICSEARCH })
                .promise();

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
            records.push(
                createDynamoStreamRecord("REMOVE", { Keys: DeleteRequest.Key, OldImage: Item })
            );
        }

        if (PutRequest) {
            const { Item } = PutRequest;
            records.push(
                createDynamoStreamRecord("INSERT", {
                    Keys: { PK: Item.PK, SK: Item.SK },
                    NewImage: Item
                })
            );
        }
    }
    await handler(createDynamoStreamEvent(...records));
};

const processParams = async (documentClient, handler, method, params) => {
    switch (method) {
        case "delete":
            await processDelete(documentClient, handler, params);
            break;
        case "batchWrite":
            await processBatchWrite(documentClient, handler, params);
            break;
        default:
            await processPut(documentClient, handler, params);
    }
};

const simulateStream = (documentClient, handler) => {
    const methods = ["put", "update", "delete", "batchWrite"];
    methods.map(method => {
        const originalMethod = documentClient[method];
        documentClient[method] = (params, callback) => {
            if (!callback) {
                return {
                    promise: async () => {
                        await processParams(documentClient, handler, method, params);
                        return new Promise((resolve, reject) => {
                            originalMethod.apply(documentClient, [
                                params,
                                (err, data) => {
                                    if (err) {
                                        reject(err);
                                    } else {
                                        resolve(data);
                                    }
                                }
                            ]);
                        });
                    }
                };
            }

            processParams(documentClient, handler, method, params).then(() => {
                originalMethod.apply(documentClient, [params, callback]);
            });
        };
    });
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
            Keys: Converter.marshall(Keys),
            NewImage: NewImage ? Converter.marshall(NewImage) : undefined,
            OldImage: OldImage ? Converter.marshall(OldImage) : undefined,
            SequenceNumber: "300000000029551639656",
            SizeBytes: 14,
            StreamViewType: "NEW_AND_OLD_IMAGES"
        },
        eventSourceARN:
            "arn:aws:dynamodb:eu-central-1:111111111111:table/streams-11111111/stream/2021-02-21T20:12:44.976"
    };
};

const createDynamoStreamEvent = (...records) => {
    return { Records: records };
};

module.exports = {
    simulateStream,
    createDynamoStreamEvent,
    createDynamoStreamRecord
};
