import { Handler } from "~/sync/handler/Handler.js";
import { createMockEventBridgeClient } from "~tests/mocks/eventBridgeClient.js";
import { createMockHandlerConverter } from "~tests/mocks/handlerConverter.js";
import {
    DeleteCommand,
    GetCommand,
    PutCommand,
    QueryCommand,
    ScanCommand,
    UpdateCommand
} from "@webiny/aws-sdk/client-dynamodb";
import { createMockSyncHandler } from "~tests/mocks/syncHandler.js";
import { PutEventsCommand, PutEventsCommandOutput } from "@webiny/aws-sdk/client-eventbridge";
import { generateAlphaNumericId } from "@webiny/utils";

describe("Handler", () => {
    const tableName = process.env.DB_TABLE as string;

    it("should create a sync handler", async () => {
        const handler = createMockSyncHandler();

        expect(handler).toBeInstanceOf(Handler);
    });

    it("should add commands and flush them", async () => {
        const send = jest.fn(async (cmd: PutEventsCommand): Promise<PutEventsCommandOutput> => {
            return {
                Entries: (cmd.input.Entries || []).map(entry => {
                    return {
                        EventId: generateAlphaNumericId(),
                        ...entry
                    };
                }),
                FailedEntryCount: 0,
                $metadata: {
                    httpStatusCode: 200,
                    requestId: generateAlphaNumericId(),
                    extendedRequestId: undefined,
                    cfId: undefined,
                    attempts: 1,
                    totalRetryDelay: 0
                }
            };
        });

        const client = createMockEventBridgeClient({
            send
        });

        const handler = createMockSyncHandler({
            getEventBridgeClient: () => client,
            converter: createMockHandlerConverter({
                commandConverters: "all"
            })
        });

        expect(client.send).not.toHaveBeenCalled();

        /**
         * No commands so nothing to flush.
         */
        await handler.flush();
        expect(send).not.toHaveBeenCalled();

        handler.add(
            new GetCommand({
                TableName: tableName,
                Key: {
                    PK: "pk0",
                    SK: "sk0"
                }
            })
        );

        handler.add(
            new PutCommand({
                TableName: tableName,
                Item: {
                    PK: "pk1",
                    SK: "sk1"
                }
            })
        );
        handler.add(
            new DeleteCommand({
                TableName: tableName,
                Key: {
                    PK: "pk2",
                    SK: "sk2"
                }
            })
        );

        handler.add(
            new UpdateCommand({
                TableName: tableName,
                Key: {
                    PK: "pk3",
                    SK: "sk3"
                }
            })
        );

        handler.add(
            new QueryCommand({
                TableName: "MyTable",
                KeyConditionExpression: "pk = :pkValue",
                ExpressionAttributeValues: {
                    ":pkValue": {
                        S: "user#123"
                    }
                },
                FilterExpression: "status = :statusVal",
                ScanIndexForward: true,
                Limit: 10
            })
        );

        handler.add(
            new ScanCommand({
                TableName: "MyTable",
                Limit: 10
            })
        );

        handler.add(
            new PutCommand({
                TableName: tableName,
                Item: {
                    PK: "LOG",
                    SK: "sk4"
                }
            })
        );

        // @ts-expect-error
        expect(handler.commands).toHaveLength(7);

        const result = await handler.flush();

        expect(result).toBeDefined();
        expect(result).not.toBeNull();

        expect(result).toMatchObject({
            Entries: expect.toBeArray(),
            FailedEntryCount: 0,
            $metadata: {
                httpStatusCode: expect.any(Number),
                requestId: expect.any(String),
                extendedRequestId: undefined,
                cfId: undefined,
                attempts: expect.any(Number),
                totalRetryDelay: expect.any(Number)
            }
        });

        // @ts-expect-error
        const detail = JSON.parse(result?.Entries?.[0]?.Detail || "{}");

        expect(detail).toBeDefined();

        expect(detail.items).toHaveLength(3);

        expect(detail.items).toContainValues([
            {
                tableName: "DynamoDB",
                command: "put",
                tableType: "regular",
                PK: "pk1",
                SK: "sk1"
            },
            {
                tableName: "DynamoDB",
                command: "delete",
                tableType: "regular",
                PK: "pk2",
                SK: "sk2"
            },
            {
                tableName: "DynamoDB",
                command: "update",
                tableType: "regular",
                PK: "pk3",
                SK: "sk3"
            }
        ]);

        // @ts-expect-error
        expect(handler.commands).toHaveLength(0);

        expect(send).toHaveBeenCalledTimes(1);
    });

    it("should throw an error on flush due to unknown error", async () => {
        const client = createMockEventBridgeClient({
            send: async () => {
                throw new Error("Unspecified error.");
            }
        });

        const handler = createMockSyncHandler({
            getEventBridgeClient: () => client,
            converter: "all"
        });

        handler.add(
            new PutCommand({
                TableName: tableName,
                Item: {
                    PK: "pk1",
                    SK: "sk1"
                }
            })
        );

        const errorFn = jest.fn();

        console.error = errorFn;

        try {
            const result = await handler.flush();
            expect(result).toEqual("SHOULD NOT REACH!");
        } catch (ex) {
            expect(ex.message).toEqual("Unspecified error.");
        }

        expect(errorFn).toHaveBeenCalledWith("Unspecified error.");
    });
});
