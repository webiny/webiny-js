import { DocumentClient } from "aws-sdk/clients/dynamodb";
import BatchProcess from "./BatchProcess";
import QueryGenerator from "./QueryGenerator";
import { DbDriver, Args, Result } from "@webiny/db";

type ConstructorArgs = {
    documentClient?: DocumentClient;
};

class DynamoDbDriver implements DbDriver {
    batchProcesses: Record<string, BatchProcess>;
    documentClient: DocumentClient;
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
            const update = {
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

    getBatchProcess(__batch): BatchProcess {
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
