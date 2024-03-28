import { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb";
import { DbDriver, Result } from "@webiny/db";

interface ConstructorArgs {
    documentClient: DynamoDBDocument;
}

class DynamoDbDriver implements DbDriver {
    batchProcesses: Record<string, any>;
    documentClient: DynamoDBDocument;
    constructor({ documentClient }: ConstructorArgs) {
        this.batchProcesses = {};
        this.documentClient = documentClient;
    }

    getClient() {
        return this.documentClient;
    }
    async create(): Promise<Result> {
        return [true, {}];
    }

    async update(): Promise<Result> {
        return [true, {}];
    }

    async delete(): Promise<Result> {
        return [true, {}];
    }

    async read<T>(): Promise<Result<T[]>> {
        return [[], {}];
    }

    async createLog(): Promise<Result> {
        return [true, {}];
    }

    async readLogs<T>() {
        return this.read<T>();
    }

    getBatchProcess() {
        // not empty
    }
}

export default DynamoDbDriver;
