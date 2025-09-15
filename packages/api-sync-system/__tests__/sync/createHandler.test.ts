import { describe, expect, it } from "vitest";
import { createHandler } from "~/sync/createHandler.js";
import { createMockSystem } from "~tests/mocks/system.js";
import { createMockManifest } from "~tests/mocks/manifest.js";
import { Handler } from "~/sync/handler/Handler.js";
import { HandlerConverter } from "~/sync/handler/HandlerConverter.js";
import {
    BatchGetCommand,
    BatchWriteCommand,
    DeleteCommand,
    GetCommand,
    PutCommand,
    UpdateCommand
} from "@webiny/aws-sdk/client-dynamodb/index.js";
import { PutCommandValue } from "~/sync/handler/converter/commands/PutCommandValue.js";
import { UpdateCommandValue } from "~/sync/handler/converter/commands/UpdateCommandValue.js";
import { NullCommandValue } from "~/sync/handler/converter/commands/NullCommandValue.js";
import { DeleteCommandValue } from "~/sync/handler/converter/commands/DeleteCommandValue.js";
import { BatchWriteCommandValue } from "~/sync/handler/converter/commands/BatchWriteCommandValue.js";
import { getTableType } from "~/sync/utils/getTableType.js";
import { createMockPluginsContainer } from "~tests/mocks/plugins.js";
import {
    createEventBridgeClient,
    EventBridgeClient,
    PutEventsCommand
} from "@webiny/aws-sdk/client-eventbridge/index.js";
import { mockClient } from "aws-sdk-client-mock";

describe("createHandler", () => {
    const tableName = process.env.DB_TABLE as string;

    it("should create a handler and a converter", async () => {
        const mockedEventBridgeClient = mockClient(EventBridgeClient);
        mockedEventBridgeClient.on(PutEventsCommand).resolves({
            $metadata: {
                httpStatusCode: 200
            }
        });

        const { handler, converter } = createHandler({
            getEventBridgeClient: createEventBridgeClient,
            system: createMockSystem(),
            manifest: createMockManifest(),
            getPlugins: () => {
                return createMockPluginsContainer();
            }
        });

        expect(handler).toBeInstanceOf(Handler);
        expect(converter).toBeInstanceOf(HandlerConverter);
    });

    it("should convert delete command", async () => {
        const mockedEventBridgeClient = mockClient(EventBridgeClient);
        mockedEventBridgeClient.on(PutEventsCommand).resolves({
            $metadata: {
                httpStatusCode: 200
            }
        });

        const { converter } = createHandler({
            system: createMockSystem(),
            manifest: createMockManifest(),
            getEventBridgeClient: createEventBridgeClient,
            getPlugins() {
                return createMockPluginsContainer();
            }
        });

        const result = converter.convert(
            new DeleteCommand({
                TableName: tableName,
                Key: {
                    PK: "p1",
                    SK: "s1"
                }
            })
        );

        expect(result).toBeInstanceOf(DeleteCommandValue);
        const items = result.getItems();
        expect(items).toHaveLength(1);
        expect(items?.[0]).toEqual({
            command: "delete",
            PK: "p1",
            SK: "s1",
            tableName,
            tableType: getTableType(tableName),
            input: expect.any(Object)
        });
    });

    it("should convert put command", async () => {
        const mockedEventBridgeClient = mockClient(EventBridgeClient);
        mockedEventBridgeClient.on(PutEventsCommand).resolves({
            $metadata: {
                httpStatusCode: 200
            }
        });

        const { converter } = createHandler({
            getEventBridgeClient: createEventBridgeClient,
            getPlugins() {
                return createMockPluginsContainer();
            },
            system: createMockSystem(),
            manifest: createMockManifest()
        });

        const result = converter.convert(
            new PutCommand({
                TableName: tableName,
                Item: {
                    PK: "p1",
                    SK: "s1"
                }
            })
        );

        expect(result).toBeInstanceOf(PutCommandValue);
        const items = result.getItems();
        expect(items).toHaveLength(1);
        expect(items?.[0]).toEqual({
            command: "put",
            PK: "p1",
            SK: "s1",
            tableName,
            tableType: getTableType(tableName),
            input: expect.any(Object)
        });
    });

    it("should convert update command", async () => {
        const mockedEventBridgeClient = mockClient(EventBridgeClient);
        mockedEventBridgeClient.on(PutEventsCommand).resolves({
            $metadata: {
                httpStatusCode: 200
            }
        });

        const { converter } = createHandler({
            getEventBridgeClient: createEventBridgeClient,
            getPlugins() {
                return createMockPluginsContainer();
            },
            system: createMockSystem(),
            manifest: createMockManifest()
        });

        const result = converter.convert(
            new UpdateCommand({
                TableName: tableName,
                Key: {
                    PK: "p1",
                    SK: "s1"
                }
            })
        );

        expect(result).toBeInstanceOf(UpdateCommandValue);
        const items = result.getItems();
        expect(items).toHaveLength(1);
        expect(items?.[0]).toEqual({
            command: "update",
            PK: "p1",
            SK: "s1",
            tableName,
            tableType: getTableType(tableName),
            input: expect.any(Object)
        });
    });

    it("should convert get command", async () => {
        const mockedEventBridgeClient = mockClient(EventBridgeClient);
        mockedEventBridgeClient.on(PutEventsCommand).resolves({
            $metadata: {
                httpStatusCode: 200
            }
        });

        const { converter } = createHandler({
            getEventBridgeClient: createEventBridgeClient,
            getPlugins() {
                return createMockPluginsContainer();
            },
            system: createMockSystem(),
            manifest: createMockManifest()
        });

        const result = converter.convert(
            new GetCommand({
                TableName: tableName,
                Key: {
                    PK: "p1",
                    SK: "s1"
                }
            })
        );

        expect(result).toBeInstanceOf(NullCommandValue);
        const items = result.getItems();
        expect(items).toBeNull();
    });

    it("should convert batch get command", async () => {
        const mockedEventBridgeClient = mockClient(EventBridgeClient);
        mockedEventBridgeClient.on(PutEventsCommand).resolves({
            $metadata: {
                httpStatusCode: 200
            }
        });

        const { converter } = createHandler({
            getEventBridgeClient: createEventBridgeClient,
            getPlugins() {
                return createMockPluginsContainer();
            },
            system: createMockSystem(),
            manifest: createMockManifest()
        });

        const result = converter.convert(
            new BatchGetCommand({
                RequestItems: {
                    [tableName]: {
                        Keys: [
                            {
                                PK: "p1",
                                SK: "s1"
                            },
                            {
                                PK: "p2",
                                SK: "s2"
                            }
                        ]
                    }
                }
            })
        );

        expect(result).toBeInstanceOf(NullCommandValue);
        const items = result.getItems();
        expect(items).toBeNull();
    });

    it("should convert batch write command", async () => {
        const mockedEventBridgeClient = mockClient(EventBridgeClient);
        mockedEventBridgeClient.on(PutEventsCommand).resolves({
            $metadata: {
                httpStatusCode: 200
            }
        });
        const { converter } = createHandler({
            getEventBridgeClient: createEventBridgeClient,
            getPlugins() {
                return createMockPluginsContainer();
            },
            system: createMockSystem(),
            manifest: createMockManifest()
        });

        const result = converter.convert(
            new BatchWriteCommand({
                RequestItems: {
                    [tableName]: [
                        {
                            PutRequest: {
                                Item: {
                                    PK: "p1",
                                    SK: "s1"
                                }
                            }
                        },
                        {
                            DeleteRequest: {
                                Key: {
                                    PK: "p2",
                                    SK: "s2"
                                }
                            }
                        },
                        {
                            PutRequest: {
                                Item: {
                                    PK: "p3",
                                    SK: "s3"
                                }
                            }
                        },
                        {
                            DeleteRequest: {
                                Key: {
                                    PK: "p4",
                                    SK: "s4"
                                }
                            }
                        },
                        {
                            DeleteRequest: {
                                Key: {
                                    PK: "p5",
                                    SK: "s5"
                                }
                            }
                        }
                    ]
                }
            })
        );

        expect(result).toBeInstanceOf(BatchWriteCommandValue);
        const items = result.getItems();
        expect(items).toHaveLength(5);
        expect(items).toEqual([
            {
                command: "put",
                PK: "p1",
                SK: "s1",
                tableName,
                tableType: getTableType(tableName),
                input: expect.any(Object)
            },
            {
                command: "delete",
                PK: "p2",
                SK: "s2",
                tableName,
                tableType: getTableType(tableName),
                input: expect.any(Object)
            },
            {
                command: "put",
                PK: "p3",
                SK: "s3",
                tableName,
                tableType: getTableType(tableName),
                input: expect.any(Object)
            },
            {
                command: "delete",
                PK: "p4",
                SK: "s4",
                tableName,
                tableType: getTableType(tableName),
                input: expect.any(Object)
            },
            {
                command: "delete",
                PK: "p5",
                SK: "s5",
                tableName,
                tableType: getTableType(tableName),
                input: expect.any(Object)
            }
        ]);
    });

    it("should not convert batch write command if no table", async () => {
        const mockedEventBridgeClient = mockClient(EventBridgeClient);
        mockedEventBridgeClient.on(PutEventsCommand).resolves({
            $metadata: {
                httpStatusCode: 200
            }
        });
        const { converter } = createHandler({
            getEventBridgeClient: createEventBridgeClient,
            getPlugins() {
                return createMockPluginsContainer();
            },
            system: createMockSystem(),
            manifest: createMockManifest()
        });

        const result = converter.convert(
            new BatchWriteCommand({
                RequestItems: {}
            })
        );

        expect(result).toBeInstanceOf(BatchWriteCommandValue);
        const items = result.getItems();
        expect(items).toBeNull();
    });

    it("should not convert batch write command if no items in table", async () => {
        const mockedEventBridgeClient = mockClient(EventBridgeClient);
        mockedEventBridgeClient.on(PutEventsCommand).resolves({
            $metadata: {
                httpStatusCode: 200
            }
        });
        const { converter } = createHandler({
            getEventBridgeClient: createEventBridgeClient,
            getPlugins() {
                return createMockPluginsContainer();
            },
            system: createMockSystem(),
            manifest: createMockManifest()
        });

        const result = converter.convert(
            new BatchWriteCommand({
                RequestItems: {
                    [tableName]: []
                }
            })
        );

        expect(result).toBeInstanceOf(BatchWriteCommandValue);
        const items = result.getItems();
        expect(items).toBeNull();
    });
});
