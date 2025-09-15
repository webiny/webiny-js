import {
    attachToDynamoDbDocument,
    decorateClientWithHandler
} from "~/sync/attachToDynamoDbDocument.js";
import { createHandler } from "~/sync/createHandler.js";
import { createMockSystem } from "~tests/mocks/system.js";
import { createMockManifest } from "~tests/mocks/manifest.js";
import { getDocumentClient } from "@webiny/aws-sdk/client-dynamodb/getDocumentClient.js";
import { createMockPluginsContainer } from "~tests/mocks/plugins.js";
import type { IDynamoDbCommand, IHandler } from "~/sync/types.js";
import type {
    BatchWriteCommandInput,
    DeleteCommandInput,
    DynamoDBDocument,
    PutCommandInput,
    UpdateCommandInput
} from "@webiny/aws-sdk/client-dynamodb/index.js";
import { PutCommand } from "@webiny/aws-sdk/client-dynamodb/index.js";
import {
    createEventBridgeClient,
    EventBridgeClient,
    PutEventsCommand
} from "@webiny/aws-sdk/client-eventbridge/index.js";
import { mockClient } from "aws-sdk-client-mock";
import { describe, expect, it, vi } from "vitest";

describe("attachToDynamoDbDocument", () => {
    it("should not have attached decorator", async () => {
        const client = getDocumentClient();
        // @ts-expect-error
        expect(client.__decoratedByWebiny).toBeUndefined();

        const anotherClient = getDocumentClient();
        // @ts-expect-error
        expect(anotherClient.__decoratedByWebiny).toBeUndefined();
    });

    it("should attach a decorator to the DynamoDB DocumentClient", async () => {
        const mockedEventBridgeClient = mockClient(EventBridgeClient);
        mockedEventBridgeClient.on(PutEventsCommand).resolves({
            $metadata: {
                httpStatusCode: 200
            }
        });

        const initialClient = getDocumentClient();
        // @ts-expect-error
        expect(initialClient.__decoratedByWebiny).toBeUndefined();

        const { handler } = createHandler({
            system: createMockSystem(),
            manifest: createMockManifest(),
            commandConverters: [],
            getEventBridgeClient: createEventBridgeClient,
            getPlugins() {
                return createMockPluginsContainer();
            }
        });

        attachToDynamoDbDocument({
            handler
        });

        const client = getDocumentClient();
        // @ts-expect-error
        expect(client.__decoratedByWebiny).toBe(true);
    });

    it("should directly decorate DynamoDB DocumentClient", async () => {
        const clientBatchWrite = vi.fn();
        const clientDelete = vi.fn();
        const clientPut = vi.fn();
        const clientUpdate = vi.fn();
        const clientSend = vi.fn();

        const client = {
            batchWrite: function (args, options) {
                return clientBatchWrite(args, options);
            },
            delete: function (args, options) {
                return clientDelete(args, options);
            },
            put: function (args, options) {
                return clientPut(args, options);
            },

            update: function (args, options) {
                return clientUpdate(args, options);
            },
            send: function (command, options) {
                return clientSend(command, options);
            }
        } as DynamoDBDocument;

        // @ts-expect-error
        client.webinyMockClient = true;

        const commands: IDynamoDbCommand[] = [];

        const handler: IHandler = {
            id: "",
            add: (input: IDynamoDbCommand): void => {
                commands.push(input);
            },
            flush: async (): Promise<null> => {
                return null;
            }
        };

        const decorated = decorateClientWithHandler({
            handler,
            client
        });

        expect(decorated).toHaveProperty("send");
        expect(decorated).toHaveProperty("batchWrite");
        expect(decorated).toHaveProperty("delete");
        expect(decorated).toHaveProperty("put");
        expect(decorated).toHaveProperty("update");
        // @ts-expect-error
        expect(decorated.__webinyHandler).toBeDefined();

        const batchWriteCommand: BatchWriteCommandInput = {
            RequestItems: {
                TestTable: [
                    {
                        PutRequest: { Item: { PK: "pk1", SK: "sk1" } }
                    },
                    {
                        DeleteRequest: { Key: { PK: "pk2", SK: "sk2" } }
                    }
                ]
            }
        };
        const putCommand: PutCommandInput = {
            TableName: "TestTable",
            Item: {
                PK: "pk3",
                SK: "sk3"
            }
        };
        const updateCommand: UpdateCommandInput = {
            TableName: "TestTable",
            Key: {
                PK: "pk4",
                SK: "sk4"
            },
            UpdateExpression: "set #attr = :val",
            ExpressionAttributeNames: { "#attr": "attribute" },
            ExpressionAttributeValues: { ":val": "value" }
        };
        const deleteCommand: DeleteCommandInput = {
            TableName: "TestTable",
            Key: {
                PK: "pk5",
                SK: "sk5"
            }
        };
        const sendCommand = new PutCommand({
            TableName: "TestTable",
            Item: {
                PK: "pk6",
                SK: "sk6"
            }
        });

        await decorated.batchWrite(batchWriteCommand);
        await decorated.put(putCommand);
        await decorated.update(updateCommand);
        await decorated.delete(deleteCommand);
        await decorated.send(sendCommand);

        expect(clientBatchWrite).toHaveBeenCalledWith(batchWriteCommand, undefined);
        expect(clientPut).toHaveBeenCalledWith(putCommand, undefined);
        expect(clientUpdate).toHaveBeenCalledWith(updateCommand, undefined);
        expect(clientDelete).toHaveBeenCalledWith(deleteCommand, undefined);
        expect(clientSend).toHaveBeenCalledWith(sendCommand, undefined);
        expect(commands).toHaveLength(5);

        // @ts-expect-error
        expect(decorated.webinyMockClient).toBeTrue();

        expect(commands[0]).toMatchObject({});
    });
});
