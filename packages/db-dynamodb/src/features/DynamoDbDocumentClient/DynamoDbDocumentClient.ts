import type { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb/index.js";
import {
    GetCommand,
    PutCommand,
    DeleteCommand,
    BatchGetCommand,
    BatchWriteCommand,
    ScanCommand,
    DocQueryCommand
} from "@webiny/aws-sdk/client-dynamodb/index.js";
import type {
    DocQueryCommandInput,
    QueryCommandOutput,
    BatchGetCommandInput,
    ScanCommandInput
} from "@webiny/aws-sdk/client-dynamodb/index.js";
import type { GenericRecord } from "@webiny/api/types.js";
import lodashChunk from "lodash/chunk.js";
import { WebinyError } from "@webiny/error";
import type {
    IDynamoDbDocumentClient,
    IKeyAttributes,
    IQueryPageResponse,
    IQueryParams,
    IScanParams,
    IScanResponse
} from "./abstractions.js";

export interface IDynamoDbDocumentClientParams {
    documentClient: DynamoDBDocument;
    tableName: string;
}

const MAX_BATCH_GET_CHUNK = 100;
const MAX_BATCH_WRITE_CHUNK = 25;

export class DynamoDbDocumentClient implements IDynamoDbDocumentClient {
    private readonly documentClient: DynamoDBDocument;
    private readonly tableName: string;

    public constructor(params: IDynamoDbDocumentClientParams) {
        this.documentClient = params.documentClient;
        this.tableName = params.tableName;
    }

    public getTableName(): string {
        return this.tableName;
    }

    public getDocumentClient(): DynamoDBDocument {
        return this.documentClient;
    }

    public async get<T>(keys: GenericRecord): Promise<T | null> {
        const result = await this.documentClient.send(
            new GetCommand({
                TableName: this.tableName,
                Key: keys
            })
        );

        if (!result || !result.Item) {
            return null;
        }

        return result.Item as T;
    }

    public async put<T extends GenericRecord>(item: T): Promise<void> {
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

    public async query<T>(params: IQueryParams): Promise<T[]> {
        const items: T[] = [];
        let startKey: GenericRecord | undefined = params.startKey;

        while (true) {
            const page = await this.queryPage<T>({
                ...params,
                startKey
            });

            items.push(...page.items);

            if (!page.lastEvaluatedKey) {
                break;
            }

            startKey = page.lastEvaluatedKey;
        }

        return items;
    }

    public async queryPage<T>(params: IQueryParams): Promise<IQueryPageResponse<T>> {
        const commandInput = this.buildQueryCommandInput(params);

        const result: QueryCommandOutput = await this.documentClient.send(
            new DocQueryCommand(commandInput)
        );

        return {
            items: (result.Items || []) as T[],
            lastEvaluatedKey: result.LastEvaluatedKey
        };
    }

    public async queryOne<T>(params: IQueryParams): Promise<T | null> {
        const page = await this.queryPage<T>({
            ...params,
            limit: 1
        });

        const item = page.items[0];

        if (!item) {
            return null;
        }

        return item;
    }

    public async scan<T>(params?: IScanParams): Promise<IScanResponse<T>> {
        const commandInput = this.buildScanCommandInput(params);

        const result = await this.documentClient.send(new ScanCommand(commandInput));

        return this.buildScanResponse<T>(result, params);
    }

    public async batchGet<T>(
        keys: GenericRecord[],
        maxChunk: number = MAX_BATCH_GET_CHUNK
    ): Promise<T[]> {
        if (keys.length === 0) {
            return [];
        }

        if (maxChunk > MAX_BATCH_GET_CHUNK) {
            throw new WebinyError(
                `Cannot set to load more than ${MAX_BATCH_GET_CHUNK} items from DynamoDB at once.`,
                "DYNAMODB_MAX_BATCH_GET_LIMIT_ERROR",
                { maxChunk }
            );
        }

        const chunks = lodashChunk(keys, maxChunk);
        const items: T[] = [];

        for (const chunk of chunks) {
            const result = await this.executeBatchGet<T>(chunk);
            items.push(...result);
        }

        return items;
    }

    public async batchWrite(
        items: Array<Record<string, any>>,
        maxChunk: number = MAX_BATCH_WRITE_CHUNK
    ): Promise<void> {
        if (!items || items.length === 0) {
            return;
        }

        const chunks = lodashChunk(items, maxChunk);

        for (const chunk of chunks) {
            await this.executeBatchWrite(chunk);
        }
    }

    private async executeBatchGet<T>(keys: GenericRecord[]): Promise<T[]> {
        const input: BatchGetCommandInput = {
            RequestItems: {
                [this.tableName]: {
                    Keys: keys
                }
            }
        };

        const result = await this.documentClient.send(new BatchGetCommand(input));

        const items: T[] = [];

        if (result.Responses) {
            const tableItems = result.Responses[this.tableName];
            if (tableItems) {
                items.push(...(tableItems as T[]));
            }
        }

        /* Retry any unprocessed keys. */
        if (result.UnprocessedKeys && Object.keys(result.UnprocessedKeys).length > 0) {
            const unprocessedKeys = result.UnprocessedKeys[this.tableName];
            if (unprocessedKeys && unprocessedKeys.Keys && unprocessedKeys.Keys.length > 0) {
                const retryResult = await this.executeBatchGet<T>(
                    unprocessedKeys.Keys as GenericRecord[]
                );
                items.push(...retryResult);
            }
        }

        return items;
    }

    private async executeBatchWrite(items: Array<Record<string, any>>): Promise<void> {
        const input = {
            RequestItems: {
                [this.tableName]: items
            }
        };

        const result = await this.documentClient.send(new BatchWriteCommand(input));

        /* Retry any unprocessed items. */
        if (result.UnprocessedItems && Object.keys(result.UnprocessedItems).length > 0) {
            const unprocessedItems = result.UnprocessedItems[this.tableName];
            if (unprocessedItems && unprocessedItems.length > 0) {
                await this.executeBatchWrite(unprocessedItems);
            }
        }
    }

    private getKeyAttributes(index?: string): IKeyAttributes {
        if (!index) {
            return { pk: "PK", sk: "SK" };
        }

        if (index === "GSI_TENANT") {
            return { pk: "GSI_TENANT" };
        }

        if (index === "GSI1") {
            return { pk: "GSI1_PK", sk: "GSI1_SK" };
        }

        if (index === "GSI2") {
            return { pk: "GSI2_PK", sk: "GSI2_SK" };
        }

        /* Fallback for unknown index names. */
        return { pk: `${index}_PK`, sk: `${index}_SK` };
    }

    private buildKeyConditionExpression(params: IQueryParams): {
        keyConditionExpression: string;
        expressionAttributeNames: GenericRecord;
        expressionAttributeValues: GenericRecord;
    } {
        const keyAttrs = this.getKeyAttributes(params.index);

        const expressionAttributeNames: GenericRecord = {
            "#pk": keyAttrs.pk
        };

        const expressionAttributeValues: GenericRecord = {
            ":pk": params.partitionKey
        };

        let keyConditionExpression = "#pk = :pk";

        if (!keyAttrs.sk) {
            return {
                keyConditionExpression,
                expressionAttributeNames,
                expressionAttributeValues
            };
        }

        if (params.beginsWith !== undefined) {
            expressionAttributeNames["#sk"] = keyAttrs.sk;
            expressionAttributeValues[":sk"] = params.beginsWith;
            keyConditionExpression += " AND begins_with(#sk, :sk)";
        } else if (params.eq !== undefined) {
            expressionAttributeNames["#sk"] = keyAttrs.sk;
            expressionAttributeValues[":sk"] = params.eq;
            keyConditionExpression += " AND #sk = :sk";
        } else if (params.between !== undefined) {
            expressionAttributeNames["#sk"] = keyAttrs.sk;
            expressionAttributeValues[":sk_low"] = params.between[0];
            expressionAttributeValues[":sk_high"] = params.between[1];
            keyConditionExpression += " AND #sk BETWEEN :sk_low AND :sk_high";
        } else if (params.lt !== undefined) {
            expressionAttributeNames["#sk"] = keyAttrs.sk;
            expressionAttributeValues[":sk"] = params.lt;
            keyConditionExpression += " AND #sk < :sk";
        } else if (params.lte !== undefined) {
            expressionAttributeNames["#sk"] = keyAttrs.sk;
            expressionAttributeValues[":sk"] = params.lte;
            keyConditionExpression += " AND #sk <= :sk";
        } else if (params.gt !== undefined) {
            expressionAttributeNames["#sk"] = keyAttrs.sk;
            expressionAttributeValues[":sk"] = params.gt;
            keyConditionExpression += " AND #sk > :sk";
        } else if (params.gte !== undefined) {
            expressionAttributeNames["#sk"] = keyAttrs.sk;
            expressionAttributeValues[":sk"] = params.gte;
            keyConditionExpression += " AND #sk >= :sk";
        }

        return {
            keyConditionExpression,
            expressionAttributeNames,
            expressionAttributeValues
        };
    }

    private buildQueryCommandInput(params: IQueryParams): DocQueryCommandInput {
        const { keyConditionExpression, expressionAttributeNames, expressionAttributeValues } =
            this.buildKeyConditionExpression(params);

        const input: DocQueryCommandInput = {
            TableName: this.tableName,
            KeyConditionExpression: keyConditionExpression,
            ExpressionAttributeNames: expressionAttributeNames,
            ExpressionAttributeValues: expressionAttributeValues
        };

        if (params.index) {
            input.IndexName = params.index;
        }

        if (params.limit) {
            input.Limit = params.limit;
        }

        if (params.reverse) {
            input.ScanIndexForward = false;
        }

        if (params.consistent) {
            input.ConsistentRead = true;
        }

        if (params.startKey) {
            input.ExclusiveStartKey = params.startKey;
        }

        if (params.filters) {
            const filterParts: string[] = [];
            const filterNames: Record<string, string> = {};
            const filterValues: Record<string, any> = {};

            const filterKeys = Object.keys(params.filters);
            for (const key of filterKeys) {
                const safeKey = key.replace(/[^a-zA-Z0-9]/g, "_");
                filterNames[`#f_${safeKey}`] = key;
                filterValues[`:f_${safeKey}`] = params.filters[key];
                filterParts.push(`#f_${safeKey} = :f_${safeKey}`);
            }

            if (filterParts.length > 0) {
                input.FilterExpression = filterParts.join(" AND ");
                Object.assign(input.ExpressionAttributeNames!, filterNames);
                Object.assign(input.ExpressionAttributeValues!, filterValues);
            }
        }

        if (params.attributes && params.attributes.length > 0) {
            const projectionNames: Record<string, string> = {};
            const projectionParts: string[] = [];

            for (const attr of params.attributes) {
                const safeAttr = attr.replace(/[^a-zA-Z0-9]/g, "_");
                const nameKey = `#a_${safeAttr}`;
                projectionNames[nameKey] = attr;
                projectionParts.push(nameKey);
            }

            input.ProjectionExpression = projectionParts.join(", ");
            Object.assign(input.ExpressionAttributeNames!, projectionNames);
        }

        return input;
    }

    private buildScanCommandInput(params?: IScanParams): ScanCommandInput {
        const input: ScanCommandInput = {
            TableName: this.tableName
        };

        if (!params) {
            return input;
        }

        if (params.index) {
            input.IndexName = params.index;
        }

        if (params.limit) {
            input.Limit = params.limit;
        }

        if (params.startKey) {
            input.ExclusiveStartKey = params.startKey;
        }

        if (params.segment !== undefined) {
            input.Segment = params.segment;
        }

        if (params.totalSegments !== undefined) {
            input.TotalSegments = params.totalSegments;
        }

        if (params.consistent) {
            input.ConsistentRead = true;
        }

        if (params.filters) {
            const filterParts: string[] = [];
            const filterNames: GenericRecord = {};
            const filterValues: GenericRecord = {};

            const filterKeys = Object.keys(params.filters);
            for (const key of filterKeys) {
                const safeKey = key.replace(/[^a-zA-Z0-9]/g, "_");
                filterNames[`#f_${safeKey}`] = key;
                filterValues[`:f_${safeKey}`] = params.filters[key];
                filterParts.push(`#f_${safeKey} = :f_${safeKey}`);
            }

            if (filterParts.length > 0) {
                input.FilterExpression = filterParts.join(" AND ");
                input.ExpressionAttributeNames = filterNames;
                input.ExpressionAttributeValues = filterValues;
            }
        }

        return input;
    }

    private buildScanResponse<T>(result: any, params?: IScanParams): IScanResponse<T> {
        const response: IScanResponse<T> = {
            items: (result.Items || []) as T[],
            count: result.Count,
            scannedCount: result.ScannedCount,
            lastEvaluatedKey: result.LastEvaluatedKey,
            requestId: (result.$metadata && result.$metadata.requestId) || "",
            error: null
        };

        if (result.LastEvaluatedKey) {
            response.next = async (): Promise<IScanResponse<T>> => {
                return this.scan<T>({
                    ...params,
                    startKey: result.LastEvaluatedKey
                });
            };
        }

        return response;
    }
}
