import { describe, it, expect, vi } from "vitest";
import { DynamoDocClient } from "~/utils/DynamoDocClient";
import type { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb/index.js";

const TABLE_NAME = "TestTable";

const createMockDocClient = (responses: Record<string, any> = {}) => {
    return {
        send: vi.fn().mockImplementation((command: any) => {
            const name = command.constructor.name;
            if (responses[name]) {
                const response = responses[name];
                if (typeof response === "function") {
                    return Promise.resolve(response(command));
                }
                return Promise.resolve(response);
            }
            return Promise.resolve({});
        })
    } as unknown as DynamoDBDocument;
};

const createClient = (responses: Record<string, any> = {}) => {
    const mock = createMockDocClient(responses);
    const client = new DynamoDocClient({
        documentClient: mock,
        tableName: TABLE_NAME
    });
    return { client, mock };
};

describe("DynamoDocClient", () => {
    describe("constructor and getters", () => {
        it("should return the table name", () => {
            const { client } = createClient();
            expect(client.getTableName()).toBe(TABLE_NAME);
        });

        it("should return the document client", () => {
            const { client, mock } = createClient();
            expect(client.getDocumentClient()).toBe(mock);
        });
    });

    describe("get", () => {
        it("should return an item when found", async () => {
            const item = { PK: "pk-1", SK: "sk-1", name: "test" };
            const { client } = createClient({
                GetCommand: { Item: item }
            });

            const result = await client.get<typeof item>({ PK: "pk-1", SK: "sk-1" });

            expect(result).toEqual(item);
        });

        it("should return null when item is not found", async () => {
            const { client } = createClient({
                GetCommand: {}
            });

            const result = await client.get({ PK: "pk-1", SK: "sk-1" });

            expect(result).toBeNull();
        });

        it("should send GetCommand with correct TableName and Key", async () => {
            const { client, mock } = createClient({
                GetCommand: { Item: null }
            });

            await client.get({ PK: "pk-1", SK: "sk-1" });

            expect(mock.send).toHaveBeenCalledTimes(1);

            const sentCommand = (mock.send as any).mock.calls[0][0];
            expect(sentCommand.input).toEqual({
                TableName: TABLE_NAME,
                Key: { PK: "pk-1", SK: "sk-1" }
            });
        });
    });

    describe("put", () => {
        it("should send PutCommand with correct TableName and Item", async () => {
            const { client, mock } = createClient();

            const item = { PK: "pk-1", SK: "sk-1", data: "value" };
            await client.put(item);

            expect(mock.send).toHaveBeenCalledTimes(1);

            const sentCommand = (mock.send as any).mock.calls[0][0];
            expect(sentCommand.input).toEqual({
                TableName: TABLE_NAME,
                Item: item
            });
        });
    });

    describe("delete", () => {
        it("should send DeleteCommand with correct TableName and Key", async () => {
            const { client, mock } = createClient();

            await client.delete({ PK: "pk-1", SK: "sk-1" });

            expect(mock.send).toHaveBeenCalledTimes(1);

            const sentCommand = (mock.send as any).mock.calls[0][0];
            expect(sentCommand.input).toEqual({
                TableName: TABLE_NAME,
                Key: { PK: "pk-1", SK: "sk-1" }
            });
        });
    });

    describe("queryOne", () => {
        it("should return the first item when found", async () => {
            const items = [
                { PK: "pk-1", SK: "sk-1", name: "first" },
                { PK: "pk-1", SK: "sk-2", name: "second" }
            ];
            const { client } = createClient({
                QueryCommand: { Items: items }
            });

            const result = await client.queryOne<(typeof items)[0]>({
                partitionKey: "pk-1"
            });

            expect(result).toEqual(items[0]);
        });

        it("should return null when no items found", async () => {
            const { client } = createClient({
                QueryCommand: { Items: [] }
            });

            const result = await client.queryOne({ partitionKey: "pk-1" });

            expect(result).toBeNull();
        });

        it("should set limit to 1", async () => {
            const { client, mock } = createClient({
                QueryCommand: { Items: [] }
            });

            await client.queryOne({ partitionKey: "pk-1" });

            const sentCommand = (mock.send as any).mock.calls[0][0];
            expect(sentCommand.input.Limit).toBe(1);
        });
    });

    describe("queryPage", () => {
        it("should return items and lastEvaluatedKey", async () => {
            const items = [{ PK: "pk-1", SK: "sk-1" }];
            const lastKey = { PK: "pk-1", SK: "sk-1" };

            const { client } = createClient({
                QueryCommand: {
                    Items: items,
                    LastEvaluatedKey: lastKey
                }
            });

            const result = await client.queryPage<(typeof items)[0]>({
                partitionKey: "pk-1",
                limit: 1
            });

            expect(result.items).toEqual(items);
            expect(result.lastEvaluatedKey).toEqual(lastKey);
        });

        it("should return undefined lastEvaluatedKey when no more pages", async () => {
            const { client } = createClient({
                QueryCommand: { Items: [{ PK: "pk-1", SK: "sk-1" }] }
            });

            const result = await client.queryPage({ partitionKey: "pk-1" });

            expect(result.lastEvaluatedKey).toBeUndefined();
        });

        it("should build correct key condition for default index (PK/SK)", async () => {
            const { client, mock } = createClient({
                QueryCommand: { Items: [] }
            });

            await client.queryPage({
                partitionKey: "T#root",
                beginsWith: "L#en"
            });

            const sentCommand = (mock.send as any).mock.calls[0][0];
            expect(sentCommand.input.KeyConditionExpression).toBe(
                "#pk = :pk AND begins_with(#sk, :sk)"
            );
            expect(sentCommand.input.ExpressionAttributeNames["#pk"]).toBe("PK");
            expect(sentCommand.input.ExpressionAttributeNames["#sk"]).toBe("SK");
            expect(sentCommand.input.ExpressionAttributeValues[":pk"]).toBe("T#root");
            expect(sentCommand.input.ExpressionAttributeValues[":sk"]).toBe("L#en");
        });

        it("should build correct key condition for GSI1 index", async () => {
            const { client, mock } = createClient({
                QueryCommand: { Items: [] }
            });

            await client.queryPage({
                partitionKey: "T#root",
                index: "GSI1",
                eq: "some-value"
            });

            const sentCommand = (mock.send as any).mock.calls[0][0];
            expect(sentCommand.input.IndexName).toBe("GSI1");
            expect(sentCommand.input.ExpressionAttributeNames["#pk"]).toBe("GSI1_PK");
            expect(sentCommand.input.ExpressionAttributeNames["#sk"]).toBe("GSI1_SK");
            expect(sentCommand.input.KeyConditionExpression).toBe("#pk = :pk AND #sk = :sk");
        });

        it("should build correct key condition for GSI2 index", async () => {
            const { client, mock } = createClient({
                QueryCommand: { Items: [] }
            });

            await client.queryPage({
                partitionKey: "T#root",
                index: "GSI2",
                gte: "2024-01-01"
            });

            const sentCommand = (mock.send as any).mock.calls[0][0];
            expect(sentCommand.input.ExpressionAttributeNames["#pk"]).toBe("GSI2_PK");
            expect(sentCommand.input.ExpressionAttributeNames["#sk"]).toBe("GSI2_SK");
            expect(sentCommand.input.KeyConditionExpression).toBe("#pk = :pk AND #sk >= :sk");
        });

        it("should build correct key condition for GSI_TENANT index (no SK)", async () => {
            const { client, mock } = createClient({
                QueryCommand: { Items: [] }
            });

            await client.queryPage({
                partitionKey: "root",
                index: "GSI_TENANT"
            });

            const sentCommand = (mock.send as any).mock.calls[0][0];
            expect(sentCommand.input.ExpressionAttributeNames["#pk"]).toBe("GSI_TENANT");
            expect(sentCommand.input.ExpressionAttributeNames["#sk"]).toBeUndefined();
            expect(sentCommand.input.KeyConditionExpression).toBe("#pk = :pk");
        });

        it("should build correct key condition for between operator", async () => {
            const { client, mock } = createClient({
                QueryCommand: { Items: [] }
            });

            await client.queryPage({
                partitionKey: "pk-1",
                between: ["2024-01-01", "2024-12-31"]
            });

            const sentCommand = (mock.send as any).mock.calls[0][0];
            expect(sentCommand.input.KeyConditionExpression).toBe(
                "#pk = :pk AND #sk BETWEEN :sk_low AND :sk_high"
            );
            expect(sentCommand.input.ExpressionAttributeValues[":sk_low"]).toBe("2024-01-01");
            expect(sentCommand.input.ExpressionAttributeValues[":sk_high"]).toBe("2024-12-31");
        });

        it("should build correct key condition for lt operator", async () => {
            const { client, mock } = createClient({
                QueryCommand: { Items: [] }
            });

            await client.queryPage({
                partitionKey: "pk-1",
                lt: "sk-5"
            });

            const sentCommand = (mock.send as any).mock.calls[0][0];
            expect(sentCommand.input.KeyConditionExpression).toBe("#pk = :pk AND #sk < :sk");
        });

        it("should build correct key condition for lte operator", async () => {
            const { client, mock } = createClient({
                QueryCommand: { Items: [] }
            });

            await client.queryPage({
                partitionKey: "pk-1",
                lte: "sk-5"
            });

            const sentCommand = (mock.send as any).mock.calls[0][0];
            expect(sentCommand.input.KeyConditionExpression).toBe("#pk = :pk AND #sk <= :sk");
        });

        it("should build correct key condition for gt operator", async () => {
            const { client, mock } = createClient({
                QueryCommand: { Items: [] }
            });

            await client.queryPage({
                partitionKey: "pk-1",
                gt: "sk-5"
            });

            const sentCommand = (mock.send as any).mock.calls[0][0];
            expect(sentCommand.input.KeyConditionExpression).toBe("#pk = :pk AND #sk > :sk");
        });

        it("should set ScanIndexForward to false when reverse is true", async () => {
            const { client, mock } = createClient({
                QueryCommand: { Items: [] }
            });

            await client.queryPage({
                partitionKey: "pk-1",
                reverse: true
            });

            const sentCommand = (mock.send as any).mock.calls[0][0];
            expect(sentCommand.input.ScanIndexForward).toBe(false);
        });

        it("should set ConsistentRead when consistent is true", async () => {
            const { client, mock } = createClient({
                QueryCommand: { Items: [] }
            });

            await client.queryPage({
                partitionKey: "pk-1",
                consistent: true
            });

            const sentCommand = (mock.send as any).mock.calls[0][0];
            expect(sentCommand.input.ConsistentRead).toBe(true);
        });

        it("should pass ExclusiveStartKey when startKey is provided", async () => {
            const startKey = { PK: "pk-1", SK: "sk-5" };
            const { client, mock } = createClient({
                QueryCommand: { Items: [] }
            });

            await client.queryPage({
                partitionKey: "pk-1",
                startKey
            });

            const sentCommand = (mock.send as any).mock.calls[0][0];
            expect(sentCommand.input.ExclusiveStartKey).toEqual(startKey);
        });

        it("should build FilterExpression from filters", async () => {
            const { client, mock } = createClient({
                QueryCommand: { Items: [] }
            });

            await client.queryPage({
                partitionKey: "pk-1",
                filters: { TYPE: "cms.entry" }
            });

            const sentCommand = (mock.send as any).mock.calls[0][0];
            expect(sentCommand.input.FilterExpression).toBe("#f_TYPE = :f_TYPE");
            expect(sentCommand.input.ExpressionAttributeNames["#f_TYPE"]).toBe("TYPE");
            expect(sentCommand.input.ExpressionAttributeValues[":f_TYPE"]).toBe("cms.entry");
        });

        it("should build ProjectionExpression from attributes", async () => {
            const { client, mock } = createClient({
                QueryCommand: { Items: [] }
            });

            await client.queryPage({
                partitionKey: "pk-1",
                attributes: ["PK", "SK", "data"]
            });

            const sentCommand = (mock.send as any).mock.calls[0][0];
            expect(sentCommand.input.ProjectionExpression).toBe("#a_PK, #a_SK, #a_data");
            expect(sentCommand.input.ExpressionAttributeNames["#a_PK"]).toBe("PK");
            expect(sentCommand.input.ExpressionAttributeNames["#a_SK"]).toBe("SK");
            expect(sentCommand.input.ExpressionAttributeNames["#a_data"]).toBe("data");
        });

        it("should use fallback key attributes for unknown index", async () => {
            const { client, mock } = createClient({
                QueryCommand: { Items: [] }
            });

            await client.queryPage({
                partitionKey: "pk-1",
                index: "CUSTOM_IDX",
                beginsWith: "prefix"
            });

            const sentCommand = (mock.send as any).mock.calls[0][0];
            expect(sentCommand.input.ExpressionAttributeNames["#pk"]).toBe("CUSTOM_IDX_PK");
            expect(sentCommand.input.ExpressionAttributeNames["#sk"]).toBe("CUSTOM_IDX_SK");
        });
    });

    describe("query (auto-paginate)", () => {
        it("should auto-paginate across multiple pages", async () => {
            let callCount = 0;

            const { client } = createClient({
                QueryCommand: (command: any) => {
                    callCount++;
                    if (callCount === 1) {
                        return {
                            Items: [{ PK: "pk-1", SK: "sk-1" }],
                            LastEvaluatedKey: { PK: "pk-1", SK: "sk-1" }
                        };
                    }
                    return {
                        Items: [{ PK: "pk-1", SK: "sk-2" }]
                    };
                }
            });

            const result = await client.query({ partitionKey: "pk-1" });

            expect(result).toHaveLength(2);
            expect(result[0]).toEqual({ PK: "pk-1", SK: "sk-1" });
            expect(result[1]).toEqual({ PK: "pk-1", SK: "sk-2" });
        });

        it("should return items from a single page when no pagination needed", async () => {
            const items = [
                { PK: "pk-1", SK: "sk-1" },
                { PK: "pk-1", SK: "sk-2" }
            ];
            const { client } = createClient({
                QueryCommand: { Items: items }
            });

            const result = await client.query({ partitionKey: "pk-1" });

            expect(result).toEqual(items);
        });

        it("should pass startKey from page to page during pagination", async () => {
            let callCount = 0;
            const secondPageStartKey = { PK: "pk-1", SK: "sk-1" };

            const { client, mock } = createClient({
                QueryCommand: (command: any) => {
                    callCount++;
                    if (callCount === 1) {
                        return {
                            Items: [{ PK: "pk-1", SK: "sk-1" }],
                            LastEvaluatedKey: secondPageStartKey
                        };
                    }
                    return {
                        Items: [{ PK: "pk-1", SK: "sk-2" }]
                    };
                }
            });

            await client.query({ partitionKey: "pk-1" });

            expect(mock.send).toHaveBeenCalledTimes(2);

            const secondCallCommand = (mock.send as any).mock.calls[1][0];
            expect(secondCallCommand.input.ExclusiveStartKey).toEqual(secondPageStartKey);
        });
    });

    describe("batchGet", () => {
        it("should return items from a basic batch get", async () => {
            const items = [
                { PK: "pk-1", SK: "sk-1" },
                { PK: "pk-2", SK: "sk-2" }
            ];

            const { client } = createClient({
                BatchGetCommand: {
                    Responses: {
                        [TABLE_NAME]: items
                    }
                }
            });

            const keys = [
                { PK: "pk-1", SK: "sk-1" },
                { PK: "pk-2", SK: "sk-2" }
            ];

            const result = await client.batchGet(keys);

            expect(result).toEqual(items);
        });

        it("should return empty array for empty input", async () => {
            const { client } = createClient();

            const result = await client.batchGet([]);

            expect(result).toEqual([]);
        });

        it("should chunk requests when keys exceed maxChunk", async () => {
            const allItems: any[] = [];
            for (let i = 0; i < 150; i++) {
                allItems.push({ PK: `pk-${i}`, SK: `sk-${i}` });
            }

            const { client, mock } = createClient({
                BatchGetCommand: (command: any) => {
                    const keys = command.input.RequestItems[TABLE_NAME].Keys;
                    return {
                        Responses: {
                            [TABLE_NAME]: keys.map((k: any) => ({
                                ...k,
                                data: "value"
                            }))
                        }
                    };
                }
            });

            const result = await client.batchGet(allItems);

            /* 150 keys with default chunk of 100 = 2 batch calls. */
            expect(mock.send).toHaveBeenCalledTimes(2);
            expect(result).toHaveLength(150);
        });

        it("should retry unprocessed keys", async () => {
            let callCount = 0;

            const { client } = createClient({
                BatchGetCommand: () => {
                    callCount++;
                    if (callCount === 1) {
                        return {
                            Responses: {
                                [TABLE_NAME]: [{ PK: "pk-1", SK: "sk-1" }]
                            },
                            UnprocessedKeys: {
                                [TABLE_NAME]: {
                                    Keys: [{ PK: "pk-2", SK: "sk-2" }]
                                }
                            }
                        };
                    }
                    return {
                        Responses: {
                            [TABLE_NAME]: [{ PK: "pk-2", SK: "sk-2" }]
                        }
                    };
                }
            });

            const result = await client.batchGet([
                { PK: "pk-1", SK: "sk-1" },
                { PK: "pk-2", SK: "sk-2" }
            ]);

            expect(result).toHaveLength(2);
            expect(result).toEqual([
                { PK: "pk-1", SK: "sk-1" },
                { PK: "pk-2", SK: "sk-2" }
            ]);
        });

        it("should throw when maxChunk exceeds 100", async () => {
            const { client } = createClient();

            await expect(client.batchGet([{ PK: "pk-1", SK: "sk-1" }], 101)).rejects.toThrow(
                "Cannot set to load more than 100 items"
            );
        });
    });

    describe("batchWrite", () => {
        it("should send batch write with put requests", async () => {
            const { client, mock } = createClient();

            const items = [
                { PutRequest: { Item: { PK: "pk-1", SK: "sk-1", data: "a" } } },
                { PutRequest: { Item: { PK: "pk-2", SK: "sk-2", data: "b" } } }
            ];

            await client.batchWrite(items);

            expect(mock.send).toHaveBeenCalledTimes(1);

            const sentCommand = (mock.send as any).mock.calls[0][0];
            expect(sentCommand.input.RequestItems[TABLE_NAME]).toEqual(items);
        });

        it("should handle empty input without sending commands", async () => {
            const { client, mock } = createClient();

            await client.batchWrite([]);

            expect(mock.send).not.toHaveBeenCalled();
        });

        it("should chunk requests when items exceed maxChunk", async () => {
            const items: any[] = [];
            for (let i = 0; i < 30; i++) {
                items.push({
                    PutRequest: { Item: { PK: `pk-${i}`, SK: `sk-${i}` } }
                });
            }

            const { client, mock } = createClient();

            await client.batchWrite(items);

            /* 30 items with default chunk of 25 = 2 batch calls. */
            expect(mock.send).toHaveBeenCalledTimes(2);
        });

        it("should retry unprocessed items", async () => {
            let callCount = 0;

            const { client, mock } = createClient({
                BatchWriteCommand: () => {
                    callCount++;
                    if (callCount === 1) {
                        return {
                            UnprocessedItems: {
                                [TABLE_NAME]: [
                                    {
                                        PutRequest: {
                                            Item: { PK: "pk-2", SK: "sk-2" }
                                        }
                                    }
                                ]
                            }
                        };
                    }
                    return {};
                }
            });

            await client.batchWrite([
                { PutRequest: { Item: { PK: "pk-1", SK: "sk-1" } } },
                { PutRequest: { Item: { PK: "pk-2", SK: "sk-2" } } }
            ]);

            /* First call + retry for unprocessed items. */
            expect(mock.send).toHaveBeenCalledTimes(2);
        });
    });

    describe("scan", () => {
        it("should return scan results", async () => {
            const items = [
                { PK: "pk-1", SK: "sk-1" },
                { PK: "pk-2", SK: "sk-2" }
            ];

            const { client } = createClient({
                ScanCommand: {
                    Items: items,
                    Count: 2,
                    ScannedCount: 2,
                    $metadata: { requestId: "req-123" }
                }
            });

            const result = await client.scan();

            expect(result.items).toEqual(items);
            expect(result.count).toBe(2);
            expect(result.scannedCount).toBe(2);
            expect(result.requestId).toBe("req-123");
            expect(result.error).toBeNull();
        });

        it("should return a next callback when LastEvaluatedKey is present", async () => {
            let callCount = 0;

            const { client } = createClient({
                ScanCommand: () => {
                    callCount++;
                    if (callCount === 1) {
                        return {
                            Items: [{ PK: "pk-1", SK: "sk-1" }],
                            Count: 1,
                            ScannedCount: 1,
                            LastEvaluatedKey: { PK: "pk-1", SK: "sk-1" },
                            $metadata: { requestId: "req-1" }
                        };
                    }
                    return {
                        Items: [{ PK: "pk-2", SK: "sk-2" }],
                        Count: 1,
                        ScannedCount: 1,
                        $metadata: { requestId: "req-2" }
                    };
                }
            });

            const firstPage = await client.scan({ limit: 1 });

            expect(firstPage.items).toEqual([{ PK: "pk-1", SK: "sk-1" }]);
            expect(firstPage.next).toBeDefined();

            const secondPage = await firstPage.next!();

            expect(secondPage.items).toEqual([{ PK: "pk-2", SK: "sk-2" }]);
            expect(secondPage.next).toBeUndefined();
        });

        it("should not return a next callback when LastEvaluatedKey is absent", async () => {
            const { client } = createClient({
                ScanCommand: {
                    Items: [{ PK: "pk-1", SK: "sk-1" }],
                    Count: 1,
                    ScannedCount: 1,
                    $metadata: { requestId: "req-1" }
                }
            });

            const result = await client.scan();

            expect(result.next).toBeUndefined();
        });

        it("should pass scan parameters correctly", async () => {
            const { client, mock } = createClient({
                ScanCommand: {
                    Items: [],
                    $metadata: { requestId: "req-1" }
                }
            });

            await client.scan({
                index: "GSI1",
                limit: 10,
                segment: 0,
                totalSegments: 4,
                consistent: true
            });

            const sentCommand = (mock.send as any).mock.calls[0][0];
            expect(sentCommand.input.TableName).toBe(TABLE_NAME);
            expect(sentCommand.input.IndexName).toBe("GSI1");
            expect(sentCommand.input.Limit).toBe(10);
            expect(sentCommand.input.Segment).toBe(0);
            expect(sentCommand.input.TotalSegments).toBe(4);
            expect(sentCommand.input.ConsistentRead).toBe(true);
        });

        it("should scan with no params", async () => {
            const { client, mock } = createClient({
                ScanCommand: {
                    Items: [],
                    $metadata: { requestId: "req-1" }
                }
            });

            await client.scan();

            const sentCommand = (mock.send as any).mock.calls[0][0];
            expect(sentCommand.input).toEqual({
                TableName: TABLE_NAME
            });
        });
    });
});
