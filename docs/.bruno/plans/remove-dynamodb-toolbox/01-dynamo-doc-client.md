# Task 1: DynamoDocClient — low-level SDK wrapper

**Files:**
- Create: `packages/db-dynamodb/src/utils/DynamoDocClient.ts`
- Test: `packages/db-dynamodb/__tests__/utils/DynamoDocClient.test.ts`

**Interfaces:**
- Consumes: `DynamoDBDocument` from `@webiny/aws-sdk/client-dynamodb/index.js`
- Produces: `DynamoDocClient` class with methods: `get`, `put`, `delete`, `query`, `queryAll`, `queryPage`, `scan`, `batchGet`, `batchWrite`. All methods accept and return plain objects (not DynamoDB marshalled). This is the single point where AWS SDK commands are issued.

This class wraps `DynamoDBDocument` and handles:
- Issuing `GetCommand`, `PutCommand`, `DeleteCommand`, `QueryCommand`, `ScanCommand`, `BatchGetCommand`, `BatchWriteCommand`
- Pagination for `query`/`scan` (via `LastEvaluatedKey`)
- Chunking for batch operations (100 for reads, 25 for writes)
- Retry for `UnprocessedItems`/`UnprocessedKeys`

---

- [ ] **Step 1: Write the failing test for `get`**

```typescript
import { DynamoDocClient } from "~/utils/DynamoDocClient.js";

/* These tests use a mock DynamoDBDocument. */
const createMockDocClient = (responses: Record<string, any> = {}) => {
    return {
        send: jest.fn().mockImplementation((command: any) => {
            const name = command.constructor.name;
            if (responses[name]) {
                return Promise.resolve(responses[name]);
            }
            return Promise.resolve({});
        })
    };
};

describe("DynamoDocClient", () => {
    it("should get an item by keys", async () => {
        const mockDoc = createMockDocClient({
            GetCommand: { Item: { PK: "T#root", SK: "A#1", data: { name: "test" } } }
        });
        const client = new DynamoDocClient({
            documentClient: mockDoc as any,
            tableName: "TestTable"
        });
        const result = await client.get({ PK: "T#root", SK: "A#1" });
        expect(result).toEqual({ PK: "T#root", SK: "A#1", data: { name: "test" } });
    });

    it("should return null when item not found", async () => {
        const mockDoc = createMockDocClient({ GetCommand: {} });
        const client = new DynamoDocClient({
            documentClient: mockDoc as any,
            tableName: "TestTable"
        });
        const result = await client.get({ PK: "T#root", SK: "A#1" });
        expect(result).toBeNull();
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn test packages/db-dynamodb --testPathPattern="DynamoDocClient" 2>&1 | tail -30`
Expected: FAIL — module not found

- [ ] **Step 3: Implement `DynamoDocClient` with `get` method**

```typescript
import type { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb/index.js";
import {
    GetCommand,
    PutCommand,
    DeleteCommand,
    BatchGetCommand,
    BatchWriteCommand,
    ScanCommand
} from "@webiny/aws-sdk/client-dynamodb/index.js";
import {
    QueryCommand
} from "@webiny/aws-sdk/client-dynamodb/index.js";
import type {
    QueryCommandOutput,
    BatchWriteCommandInput,
    BatchGetCommandInput,
    ScanCommandInput
} from "@webiny/aws-sdk/client-dynamodb/index.js";
import type { GenericRecord } from "@webiny/api/types.js";
import lodashChunk from "lodash/chunk.js";
import WebinyError from "@webiny/error";

export interface IDynamoDocClientParams {
    documentClient: DynamoDBDocument;
    tableName: string;
}

export interface IQueryParams {
    partitionKey: string;
    index?: string;
    limit?: number;
    reverse?: boolean;
    consistent?: boolean;
    beginsWith?: string;
    eq?: string | number;
    lt?: string | number;
    lte?: string | number;
    gt?: string | number;
    gte?: string | number;
    between?: [string, string] | [number, number];
    startKey?: GenericRecord;
    filters?: GenericRecord;
    attributes?: string[];
}

export interface IQueryPageResponse<T> {
    items: T[];
    lastEvaluatedKey?: GenericRecord;
}

export interface IScanParams {
    index?: string;
    limit?: number;
    startKey?: GenericRecord;
    segment?: number;
    totalSegments?: number;
    filters?: GenericRecord;
    consistent?: boolean;
}

export interface IScanResponse<T> {
    items: T[];
    count?: number;
    scannedCount?: number;
    lastEvaluatedKey?: GenericRecord;
    next?: () => Promise<IScanResponse<T>>;
    requestId: string;
    error: any;
}

const MAX_BATCH_READ = 100;
const MAX_BATCH_WRITE = 25;

export class DynamoDocClient {
    private readonly documentClient: DynamoDBDocument;
    private readonly tableName: string;

    public constructor(params: IDynamoDocClientParams) {
        this.documentClient = params.documentClient;
        this.tableName = params.tableName;
    }

    public getTableName(): string {
        return this.tableName;
    }

    public getDocumentClient(): DynamoDBDocument {
        return this.documentClient;
    }

    public async get<T = GenericRecord>(keys: GenericRecord): Promise<T | null> {
        const result = await this.documentClient.send(
            new GetCommand({
                TableName: this.tableName,
                Key: keys
            })
        );
        if (!result.Item) {
            return null;
        }
        return result.Item as T;
    }

    public async put<T extends GenericRecord = GenericRecord>(item: T): Promise<void> {
        await this.documentClient.send(
            new PutCommand({
                TableName: this.tableName,
                Item: item
            })
        );
    }

    public async delete(keys: GenericRecord): Promise<void> {
        await this.documentClient.send(
            new DeleteCommand({
                TableName: this.tableName,
                Key: keys
            })
        );
    }

    public async query<T = GenericRecord>(params: IQueryParams): Promise<T[]> {
        const items: T[] = [];
        let lastKey: GenericRecord | undefined;

        do {
            const result = await this.queryPage<T>({
                ...params,
                startKey: lastKey || params.startKey
            });
            items.push(...result.items);
            lastKey = result.lastEvaluatedKey;
        } while (lastKey);

        return items;
    }

    public async queryPage<T = GenericRecord>(params: IQueryParams): Promise<IQueryPageResponse<T>> {
        const expression = this.buildKeyConditionExpression(params);
        const result = await this.documentClient.send(
            new QueryCommand({
                TableName: this.tableName,
                IndexName: params.index,
                KeyConditionExpression: expression.keyCondition,
                ExpressionAttributeNames: expression.names,
                ExpressionAttributeValues: expression.values,
                Limit: params.limit,
                ScanIndexForward: params.reverse ? false : true,
                ConsistentRead: params.consistent,
                ExclusiveStartKey: params.startKey,
                ProjectionExpression: params.attributes?.join(", ")
            })
        );
        return {
            items: (result.Items || []) as T[],
            lastEvaluatedKey: result.LastEvaluatedKey as GenericRecord | undefined
        };
    }

    public async queryOne<T = GenericRecord>(params: IQueryParams): Promise<T | null> {
        const result = await this.queryPage<T>({
            ...params,
            limit: 1
        });
        return result.items[0] || null;
    }

    public async scan<T = GenericRecord>(params?: IScanParams): Promise<IScanResponse<T>> {
        const input: ScanCommandInput = {
            TableName: this.tableName,
            IndexName: params?.index,
            Limit: params?.limit,
            ExclusiveStartKey: params?.startKey,
            Segment: params?.segment,
            TotalSegments: params?.totalSegments,
            ConsistentRead: params?.consistent
        };
        const result = await this.documentClient.send(new ScanCommand(input));

        const response: IScanResponse<T> = {
            items: (result.Items || []) as T[],
            count: result.Count,
            scannedCount: result.ScannedCount,
            lastEvaluatedKey: result.LastEvaluatedKey as GenericRecord | undefined,
            requestId: (result.$metadata as any)?.requestId || "",
            error: null
        };

        if (result.LastEvaluatedKey) {
            response.next = () => this.scan<T>({
                ...params,
                startKey: result.LastEvaluatedKey as GenericRecord
            });
        }

        return response;
    }

    public async batchGet<T = GenericRecord>(
        keys: GenericRecord[],
        maxChunk = MAX_BATCH_READ
    ): Promise<T[]> {
        if (keys.length === 0) {
            return [];
        }
        if (maxChunk > MAX_BATCH_READ) {
            throw new WebinyError(
                `Cannot batch get more than ${MAX_BATCH_READ} items at once.`,
                "DYNAMODB_MAX_BATCH_GET_LIMIT_ERROR",
                { maxChunk }
            );
        }

        const results: T[] = [];
        const chunks = lodashChunk(keys, maxChunk);

        for (const chunk of chunks) {
            const input: BatchGetCommandInput = {
                RequestItems: {
                    [this.tableName]: {
                        Keys: chunk
                    }
                }
            };

            let response = await this.documentClient.send(new BatchGetCommand(input));
            if (response.Responses?.[this.tableName]) {
                results.push(...(response.Responses[this.tableName] as T[]));
            }

            /* Retry unprocessed keys. */
            while (response.UnprocessedKeys?.[this.tableName]?.Keys?.length) {
                const retryInput: BatchGetCommandInput = {
                    RequestItems: {
                        [this.tableName]: {
                            Keys: response.UnprocessedKeys[this.tableName].Keys
                        }
                    }
                };
                response = await this.documentClient.send(new BatchGetCommand(retryInput));
                if (response.Responses?.[this.tableName]) {
                    results.push(...(response.Responses[this.tableName] as T[]));
                }
            }
        }

        return results;
    }

    public async batchWrite(
        items: BatchWriteCommandInput["RequestItems"][string],
        maxChunk = MAX_BATCH_WRITE
    ): Promise<void> {
        if (!items || items.length === 0) {
            return;
        }

        const chunks = lodashChunk(items, maxChunk);

        for (const chunk of chunks) {
            const input: BatchWriteCommandInput = {
                RequestItems: {
                    [this.tableName]: chunk
                }
            };

            let response = await this.documentClient.send(new BatchWriteCommand(input));

            /* Retry unprocessed items. */
            while (response.UnprocessedItems?.[this.tableName]?.length) {
                const retryInput: BatchWriteCommandInput = {
                    RequestItems: {
                        [this.tableName]: response.UnprocessedItems[this.tableName]
                    }
                };
                response = await this.documentClient.send(new BatchWriteCommand(retryInput));
            }
        }
    }

    private buildKeyConditionExpression(params: IQueryParams): {
        keyCondition: string;
        names: Record<string, string>;
        values: Record<string, any>;
    } {
        /* Determine partition key name based on index. */
        const pkName = params.index
            ? this.getIndexPartitionKey(params.index)
            : "PK";
        const skName = params.index
            ? this.getIndexSortKey(params.index)
            : "SK";

        const names: Record<string, string> = { "#pk": pkName };
        const values: Record<string, any> = { ":pk": params.partitionKey };
        let keyCondition = "#pk = :pk";

        if (params.beginsWith !== undefined) {
            names["#sk"] = skName;
            values[":sk"] = params.beginsWith;
            keyCondition += " AND begins_with(#sk, :sk)";
        } else if (params.eq !== undefined) {
            names["#sk"] = skName;
            values[":sk"] = params.eq;
            keyCondition += " AND #sk = :sk";
        } else if (params.between !== undefined) {
            names["#sk"] = skName;
            values[":sk_low"] = params.between[0];
            values[":sk_high"] = params.between[1];
            keyCondition += " AND #sk BETWEEN :sk_low AND :sk_high";
        } else if (params.lt !== undefined) {
            names["#sk"] = skName;
            values[":sk"] = params.lt;
            keyCondition += " AND #sk < :sk";
        } else if (params.lte !== undefined) {
            names["#sk"] = skName;
            values[":sk"] = params.lte;
            keyCondition += " AND #sk <= :sk";
        } else if (params.gt !== undefined) {
            names["#sk"] = skName;
            values[":sk"] = params.gt;
            keyCondition += " AND #sk > :sk";
        } else if (params.gte !== undefined) {
            names["#sk"] = skName;
            values[":sk"] = params.gte;
            keyCondition += " AND #sk >= :sk";
        }

        return { keyCondition, names, values };
    }

    /* These map index names to their key attribute names, matching createTable.ts defaults. */
    private getIndexPartitionKey(index: string): string {
        const map: Record<string, string> = {
            GSI_TENANT: "GSI_TENANT",
            GSI1: "GSI1_PK",
            GSI2: "GSI2_PK"
        };
        return map[index] || `${index}_PK`;
    }

    private getIndexSortKey(index: string): string {
        const map: Record<string, string> = {
            GSI1: "GSI1_SK",
            GSI2: "GSI2_SK"
        };
        return map[index] || `${index}_SK`;
    }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn test packages/db-dynamodb --testPathPattern="DynamoDocClient" 2>&1 | tail -30`
Expected: PASS

- [ ] **Step 5: Write tests for `put`, `delete`, `query`, `queryOne`, `queryPage`**

Add to the same test file — test that `put` sends a `PutCommand`, `delete` sends a `DeleteCommand`, `queryOne` returns the first item or null, `queryPage` returns items + lastEvaluatedKey.

- [ ] **Step 6: Run tests to verify**

Run: `yarn test packages/db-dynamodb --testPathPattern="DynamoDocClient" 2>&1 | tail -30`
Expected: PASS

- [ ] **Step 7: Write tests for `batchGet` and `batchWrite`**

Test chunking (pass 150 keys, verify two batches sent), test unprocessed keys retry, test empty input returns early.

- [ ] **Step 8: Run tests to verify**

Run: `yarn test packages/db-dynamodb --testPathPattern="DynamoDocClient" 2>&1 | tail -30`
Expected: PASS

- [ ] **Step 9: Write tests for `scan`**

Test basic scan, test scan with `next()` pagination callback, test scan with segment/totalSegments.

- [ ] **Step 10: Run tests to verify**

Run: `yarn test packages/db-dynamodb --testPathPattern="DynamoDocClient" 2>&1 | tail -30`
Expected: PASS

- [ ] **Step 11: Commit**

```bash
git add packages/db-dynamodb/src/utils/DynamoDocClient.ts packages/db-dynamodb/__tests__/utils/DynamoDocClient.test.ts
git commit -m "feat(db-dynamodb): add DynamoDocClient — direct AWS SDK v3 wrapper"
```
