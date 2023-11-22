/**
 * Remove this when no apps are using our internal db drivers anymore
 */
// @ts-nocheck
import { DynamoDBClient } from "@webiny/aws-sdk/client-dynamodb";
import { Batch } from "@webiny/db";

type BatchType = "batchWrite" | "batchGet";

export type AddBatchOperationResponse = () => any | null;

interface RejectBuildCallable {
    ({ message }: { message: string }): void;
}

interface RejectExecutionCallable {
    ({ message }: { message: string }): void;
}

interface AddBatchOperationArgs {
    /**
     * TODO: determine correct type.
     */
    [key: string]: any;
}

interface Response {
    /**
     * TODO: determine correct type.
     */
    [key: string]: any;
}

interface DocumentClientArgs {
    ReturnConsumedCapacity: string;
    RequestItems: Record<string, any>;
}

class BatchProcess {
    documentClient: DynamoDBClient;
    batch: Batch;
    resolveBuild: () => void;
    rejectBuild: RejectBuildCallable;
    queryBuild: Promise<void>;
    resolveExecution: () => void;
    rejectExecution: RejectExecutionCallable;
    queryExecution: Promise<void>;
    operations: [Record<string, any>, Record<string, any>][];
    batchType: BatchType;
    results: Record<string, any>[];
    response: Record<string, any>;
    constructor(batch: Batch, documentClient: DynamoDBClient) {
        this.documentClient = documentClient;
        this.batch = batch;

        this.resolveBuild = null;
        this.rejectBuild = null;
        this.queryBuild = new Promise((resolve, reject) => {
            this.resolveBuild = resolve;
            this.rejectBuild = reject;
        });

        this.resolveExecution = null;
        this.rejectExecution = null;
        this.queryExecution = new Promise((resolve, reject) => {
            this.resolveExecution = resolve;
            this.rejectExecution = reject;
        });

        this.operations = [];
        this.results = [];
        this.response = [];

        this.batchType;
    }

    waitStartExecution(): Promise<void> {
        return this.queryBuild;
    }

    waitExecution(): Promise<void> {
        return this.queryExecution;
    }

    addBatchOperation(
        type: BatchType,
        args: AddBatchOperationArgs,
        meta = {}
    ): AddBatchOperationResponse {
        if (!this.batchType) {
            this.batchType = type;
        } else if (this.batchType !== type) {
            const initial = this.batchType;
            const index = this.operations.length;
            this.rejectBuild({
                message: `Cannot batch operations - all operations must be of the same type (the initial operation type was "${initial}", and operation type on index "${index}" is "${type}").`
            });
            return null;
        }

        this.operations.push([args, meta]);
        const index = this.operations.length - 1;
        return () => this.results[index];
    }

    addBatchWrite(args: AddBatchOperationArgs): AddBatchOperationResponse {
        return this.addBatchOperation("batchWrite", args);
    }

    addBatchDelete(args: AddBatchOperationArgs): AddBatchOperationResponse {
        return this.addBatchOperation("batchWrite", { ...args }, { delete: true });
    }

    addBatchGet(args: AddBatchOperationArgs): AddBatchOperationResponse {
        return this.addBatchOperation("batchGet", args);
    }

    allOperationsAdded(): boolean {
        return this.operations.length === this.batch.operations.length;
    }

    startExecution() {
        this.resolveBuild();

        const documentClientArgs: DocumentClientArgs = {
            ReturnConsumedCapacity: "TOTAL",
            RequestItems: {}
        };

        const reject = (e: Error) => {
            e.message = `An error occurred while executing "${this.batchType}" batch operation: ${e.message}`;
            return this.rejectExecution(e);
        };

        let resolve = (response: Response) => {
            this.response = response;
            this.resolveExecution();
        };

        switch (this.batchType) {
            case "batchWrite":
                documentClientArgs.RequestItems = {};
                for (let i = 0; i < this.operations.length; i++) {
                    const [args, meta] = this.operations[i];

                    if (!documentClientArgs.RequestItems[args.table]) {
                        documentClientArgs.RequestItems[args.table] = [];
                    }

                    const push: {
                        DeleteRequest?: Record<string, any>;
                        PutRequest?: Record<string, any>;
                    } = {};

                    if (meta.delete) {
                        push.DeleteRequest = {
                            Key: args.query
                        };
                    } else {
                        push.PutRequest = {
                            Item: args.data
                        };
                    }

                    documentClientArgs.RequestItems[args.table].push(push);
                }
                break;
            case "batchGet":
                documentClientArgs.RequestItems = {};
                for (let i = 0; i < this.operations.length; i++) {
                    const [args] = this.operations[i];

                    if (!documentClientArgs.RequestItems[args.table]) {
                        documentClientArgs.RequestItems[args.table] = { Keys: [] };
                    }

                    documentClientArgs.RequestItems[args.table].Keys.push(args.query);
                }

                resolve = response => {
                    this.response = response;
                    const results = [];

                    // The results of batchGet aren't ordered so we have to figure out the order of results ourselves.
                    for (let i = 0; i < this.operations.length; i++) {
                        const [args] = this.operations[i];
                        const responseItems = response.Responses[args.table];

                        let foundResult = null;
                        outer: for (let j = 0; j < responseItems.length; j++) {
                            const responseItem = responseItems[j];
                            for (const queryKey in args.query) {
                                if (
                                    typeof responseItem[queryKey] === "undefined" ||
                                    args.query[queryKey] !== responseItem[queryKey]
                                ) {
                                    continue outer;
                                }
                            }
                            foundResult = responseItem;
                        }

                        results.push(foundResult);
                    }

                    this.results = results;
                    this.resolveExecution();
                };
                break;
        }

        return this.documentClient[this.batchType](
            documentClientArgs,
            (error: Error, result: Record<string, any>) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(result);
                }
            }
        );
    }
}

export default BatchProcess;
