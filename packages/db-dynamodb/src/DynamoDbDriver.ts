import { DocumentClient } from "aws-sdk/clients/dynamodb";
import BatchProcess from "./BatchProcess";
import QueryGenerator from "./QueryGenerator";
import { DbDriver } from "@webiny/db/types";

const propertyIsPartOfUniqueKey = (property, keys) => {
    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        if (!key.unique) {
            continue;
        }

        const fields = keys[i].fields;
        if (!Array.isArray(fields)) {
            continue;
        }

        for (let j = 0; j < fields.length; j++) {
            const field = fields[j];
            if (field.name === property) {
                return true;
            }
        }
    }
    return false;
};

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

    async create({ table, data, meta, __batch: batch }) {
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

    async update({ query, data, table, instance, keys, meta, __batch: batch }) {
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

        // It would be nice if we could rely on the received data all the time, but that's not possible. Because
        // "PutRequest" operations only insert or overwrite existing data (meaning => classic updates are NOT allowed),
        // we must get complete model data, and use that in the operation. This is possible only if the update
        // call is part of an model instance update (not part of SomeModel.save() call), where we can access the
        // toStorage function. So, if that's the case, we'll call it with the skipDifferenceCheck flag enabled.
        // Normally we wouldn't have to do all of this dancing, but it's how DynamoDB works, there's no way around it.
        const storageData = instance
            ? await instance.toStorage({ skipDifferenceCheck: true })
            : data;

        // The only problem with the above approach is that it may insert null values into GSI columns,
        // which immediately gets rejected by DynamoDB. Let's remove those here.
        const Item = {};
        for (const property in storageData) {
            // Check if key is a part of a unique index. If so, and is null, remove it from data.
            if (!propertyIsPartOfUniqueKey(property, keys)) {
                Item[property] = storageData[property];
                continue;
            }

            if (storageData[property] !== null) {
                Item[property] = storageData[property];
            }
        }

        batchProcess.addBatchWrite({
            table,
            data: Item
        });

        if (batchProcess.allOperationsAdded()) {
            batchProcess.startExecution();
        } else {
            await batchProcess.waitStartExecution();
        }

        await batchProcess.waitExecution();

        return [true, { response: batchProcess.response }];
    }

    async delete({ query, table, meta, __batch: batch }) {
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
            tableName: table,
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

    async read({ table, query, sort, limit, keys, meta, __batch: batch }) {
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
            return [response.Items, { response: response.$response }];
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

        const result = getResult();
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
