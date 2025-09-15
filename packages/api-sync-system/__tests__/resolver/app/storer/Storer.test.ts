import { getDocumentClient } from "@webiny/project-utils/testing/dynamodb/index.js";
import { createStorer, Storer } from "~/resolver/app/storer/Storer.js";
import { createRegularMockTable } from "~tests/mocks/table.js";
import {
    createMockSourceDeployment,
    createMockTargetDeployment
} from "~tests/mocks/deployments.js";
import { createMockTableItemData } from "~tests/mocks/tableItem.js";
import type { DeleteCommandInput } from "@webiny/aws-sdk/client-dynamodb/index.js";
import {
    DeleteCommand,
    DynamoDBDocument,
    ScanCommand
} from "@webiny/aws-sdk/client-dynamodb/index.js";
import { createCommandBundle } from "~/resolver/app/bundler/CommandBundle.js";
import { mockClient } from "aws-sdk-client-mock";
import { describe, expect, it, vi } from "vitest";

const item1 = createMockTableItemData({
    order: 1,
    size: "extreme"
});
const item2 = createMockTableItemData({
    order: 2,
    size: "extreme"
});
const item3 = createMockTableItemData({
    order: 3,
    size: "extreme"
});

describe("Storer", () => {
    const client = getDocumentClient();

    const table = createRegularMockTable();
    const deployment = createMockTargetDeployment();
    const sourceDeployment = createMockSourceDeployment();

    const bundle = createCommandBundle({
        source: sourceDeployment,
        table,
        command: "put"
    });

    it("should create a new Storer instance", () => {
        const storer = createStorer({
            createDocumentClient: () => {
                return client;
            }
        });

        expect(storer).toBeInstanceOf(Storer);
    });

    it("should store items in batches", async () => {
        const storer = createStorer({
            createDocumentClient: () => {
                return client;
            }
        });

        await storer.store({
            command: "put",
            items: [item1, item2, item3],
            table,
            deployment,
            bundle
        });

        const scanned = await client.send(
            new ScanCommand({
                TableName: table.name,
                Limit: 1000
            })
        );

        expect(scanned.Items).toHaveLength(3);
        expect(scanned.Items).toEqual(
            expect.arrayContaining([
                expect.objectContaining(item1),
                expect.objectContaining(item2),
                expect.objectContaining(item3)
            ])
        );
    });

    it("should throw an error if the command is not supported", async () => {
        const storer = createStorer({
            createDocumentClient: () => {
                return client;
            }
        });

        console.error = vi.fn();

        const command = "unsupported";

        await storer.store({
            // @ts-expect-error
            command,
            items: [item1],
            table,
            deployment
        });

        expect(console.error).toHaveBeenCalledWith(`Unsupported command type: ${command}`);
    });

    it("should delete items sent", async () => {
        const send = vi.fn();

        const mockedClient = mockClient(DynamoDBDocument);
        mockedClient.on(DeleteCommand).callsFake((input: DeleteCommandInput) => {
            send(input);
            return {
                $metadata: {
                    httpStatusCode: 200
                }
            };
        });

        const storer = createStorer({
            createDocumentClient: () => {
                return client;
            }
        });

        await storer.store({
            command: "delete",
            items: [item1, item2, item3],
            deployment,
            bundle,
            table
        });

        expect(send).toHaveBeenCalledTimes(3);

        expect(send).toHaveBeenNthCalledWith(1, {
            Key: {
                PK: "T#1",
                SK: "T#1"
            },
            TableName: "DynamoDB"
        });
        expect(send).toHaveBeenNthCalledWith(2, {
            Key: {
                PK: "T#2",
                SK: "T#2"
            },
            TableName: "DynamoDB"
        });
        expect(send).toHaveBeenNthCalledWith(3, {
            Key: {
                PK: "T#3",
                SK: "T#3"
            },
            TableName: "DynamoDB"
        });
    });

    it("should trigger onError when failed to store item", async () => {
        const mockedClient = mockClient(DynamoDBDocument);
        mockedClient.on(DeleteCommand).rejects("Testing error.");

        const onError = vi.fn();

        const storer = createStorer({
            maxRetries: 1,
            retryDelay: 10, // ms
            createDocumentClient: () => {
                return client;
            },
            async onError(params) {
                onError(params);
                throw new Error("Error when running onError callback.");
            }
        });

        console.error = vi.fn();
        console.log = vi.fn();

        try {
            const result = await storer.store({
                command: "delete",
                items: [item1],
                deployment,
                bundle,
                table
            });
            expect(result).toEqual("SHOULD NOT REACH");
        } catch (ex) {
            expect(ex.message).toEqual("Testing error.");
        }

        expect(onError).toHaveBeenCalledTimes(1);
        expect(onError).toHaveBeenCalledWith({
            item: item1,
            command: "delete",
            table,
            error: expect.any(Object)
        });

        expect(console.error).toHaveBeenNthCalledWith(1, "Error executing batch write command.");
        expect(console.error).toHaveBeenNthCalledWith(
            2,
            `Error in onError callback for command: delete`
        );
    });
});
