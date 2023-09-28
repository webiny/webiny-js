/**
 * Remove this when no apps are using our internal db drivers anymore
 */
// @ts-nocheck
import { DynamoDBClient } from "@webiny/aws-sdk/client-dynamodb";
import BatchProcess from "./BatchProcess";
import QueryGenerator from "./QueryGenerator";
import { DbDriver, Args, Result, ArgsBatch } from "@webiny/db";
import { QueryKeys } from "~/types";

type ConstructorArgs = {
    documentClient?: DynamoDBClient;
};

const LOG_KEYS: QueryKeys = [
    {
        primary: true,
        unique: true,
        name: "primary",
        fields: [{ name: "PK" }, { name: "SK" }]
    }
];

interface Update {
    UpdateExpression: string;
    ExpressionAttributeNames: Record<string, any>;
    ExpressionAttributeValues: Record<string, any>;
}

interface ReadLogsParams {
    table: string;
}

interface CreateLogParams {
    id: string;
    operation: string;
    /**
     * TODO: determine the data type.
     */
    data: any;
    table: string;
}

class DynamoDbDriver implements DbDriver {
    batchProcesses: Record<string, BatchProcess>;
    documentClient: DynamoDBClient;
    constructor({ documentClient }: ConstructorArgs = {}) {
        this.batchProcesses = {};
        this.documentClient = documentClient || new DocumentClient();
    }

    getClient() {
        return this.documentClient;
    }

    async create({ table, data, meta, __batch: batch }: Args): Promise<Result> {
        if (!batch) {
            const result = await this.documentClient
                .put({
                    TableName: table,
                    Item: data,
                    ReturnConsumedCapacity: meta ? "TOTAL" : "NONE"
                })
                .promise();
            return [true, { response: result.$response }];
        }

        const batchProcess = this.getBatchProcess(batch);
        batchProcess.addBatchWrite({ table, data });

        if (batchProcess.allOperationsAdded()) {
            batchProcess.startExecution();
        } else {
            await batchProcess.waitStartExecution();
        }

        await batchProcess.waitExecution();

        return [true, { response: batchProcess.response }];
    }

    async update({ query, data, table, meta, __batch: batch }: Args): Promise<Result> {
        if (!batch) {
            const update: Update = {
                UpdateExpression: "SET ",
                ExpressionAttributeNames: {},
                ExpressionAttributeValues: {}
            };

            const updateExpression = [];
            for (const key in data) {
                updateExpression.push(`#${key} = :${key}`);
                update.ExpressionAttributeNames[`#${key}`] = key;
                update.ExpressionAttributeValues[`:${key}`] = data[key];
            }

            update.UpdateExpression += updateExpression.join(", ");

            const result = await this.documentClient
                .update({
                    TableName: table,
                    Key: query,
                    ReturnConsumedCapacity: meta ? "TOTAL" : "NONE",
                    ...update
                })
                .promise();

            return [true, { response: result.$response }];
        }

        const batchProcess = this.getBatchProcess(batch);

        batchProcess.addBatchWrite({
            table,
            data
        });

        if (batchProcess.allOperationsAdded()) {
            batchProcess.startExecution();
        } else {
            await batchProcess.waitStartExecution();
        }

        await batchProcess.waitExecution();

        return [true, { response: batchProcess.response }];
    }

    async delete({ query, table, meta, __batch: batch }: Args): Promise<Result> {
        if (!batch) {
            const result = await this.documentClient
                .delete({
                    TableName: table,
                    Key: query,
                    ReturnConsumedCapacity: meta ? "TOTAL" : "NONE"
                })
                .promise();

            return [true, { response: result.$response }];
        }

        const batchProcess = this.getBatchProcess(batch);
        batchProcess.addBatchDelete({
            table,
            query
        });

        if (batchProcess.allOperationsAdded()) {
            batchProcess.startExecution();
        } else {
            await batchProcess.waitStartExecution();
        }

        await batchProcess.waitExecution();

        return [true, { response: batchProcess.response }];
    }

    async read<T>({
        table,
        query,
        sort,
        limit,
        keys,
        meta,
        __batch: batch
    }: Args): Promise<Result<T[]>> {
        if (!batch) {
            const queryGenerator = new QueryGenerator();
            const queryParams = queryGenerator.generate({
                query,
                keys,
                sort,
                limit,
                tableName: table
            });

            const response = await this.documentClient
                .query({ ...queryParams, ReturnConsumedCapacity: meta ? "TOTAL" : "NONE" })
                .promise();

            if (Array.isArray(response.Items)) {
                return [response.Items as T[], { response: response.$response }];
            }
            return [[], { response: response.$response }];
        }

        // DynamoDb doesn't support batch queries, so we can immediately assume the GetRequest operation.
        const batchProcess = this.getBatchProcess(batch);
        const getResult = batchProcess.addBatchGet({
            table,
            query
        });

        if (batchProcess.allOperationsAdded()) {
            batchProcess.startExecution();
        } else {
            await batchProcess.waitStartExecution();
        }

        await batchProcess.waitExecution();

        const result = getResult() as T;
        if (result) {
            return [[result], { response: batchProcess.response }];
        }

        return [[], { response: batchProcess.response }];
    }

    async createLog({ id, operation, data, table }: CreateLogParams): Promise<Result> {
        await this.create({
            table: table,
            keys: LOG_KEYS,
            data: {
                PK: "log",
                SK: id,
                id,
                operation,
                ...data
            }
        });

        return [true, {}];
    }

    async readLogs<T>({ table }: ReadLogsParams) {
        return this.read<T>({
            table,
            keys: LOG_KEYS,
            query: {
                PK: "log",
                SK: { $gte: " " }
            }
        });
    }

    getBatchProcess(__batch: ArgsBatch): BatchProcess {
        if (!this.batchProcesses[__batch.instance.id]) {
            this.batchProcesses[__batch.instance.id] = new BatchProcess(
                __batch.instance,
                this.documentClient
            );
        }

        return this.batchProcesses[__batch.instance.id];
    }
}

export default DynamoDbDriver;
