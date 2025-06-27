import type { IStorer, IStorerExecParams } from "./types";
import type {
    BatchWriteCommandInput,
    DynamoDBDocument
} from "@webiny/aws-sdk/client-dynamodb/index.js";
import { BatchWriteCommand } from "@webiny/aws-sdk/client-dynamodb/index.js";
import type { IDeployment } from "~/resolver/deployment/types.js";
import { convertException } from "@webiny/utils/exception.js";
import lodashChunk from "lodash/chunk";
import type { CommandType } from "~/types.js";
import { createRetry } from "../utils/Retry";

export interface IStorerParamsCreateDocumentClientCallable {
    (deployment: Pick<IDeployment, "region">): Pick<DynamoDBDocument, "send">;
}

export interface IStorerParams {
    maxBatchSize?: number;
    maxRetries?: number;
    retryDelay?: number;
    createDocumentClient: IStorerParamsCreateDocumentClientCallable;
}

interface IRequestType {
    name: "PutRequest" | "DeleteRequest";
    key: "Item" | "Key";
}

export class Storer implements IStorer {
    private readonly maxBatchSize: number;
    private readonly maxRetries: number;
    private readonly retryDelay: number;
    private readonly createDocumentClient: IStorerParamsCreateDocumentClientCallable;

    public constructor(params: IStorerParams) {
        this.maxBatchSize = params.maxBatchSize || 25;
        this.maxRetries = params.maxRetries || 10;
        this.retryDelay = params.retryDelay || 1000;
        this.createDocumentClient = params.createDocumentClient;
    }

    public async store(params: IStorerExecParams): Promise<void> {
        const { deployment, table, command, items } = params;
        if (items.length === 0) {
            return;
        }
        const client = this.createDocumentClient({
            region: deployment.region
        });

        let requestType: IRequestType;
        try {
            requestType = this.getRequestType(command);
        } catch (ex) {
            console.error(`Error getting request type: ${command}.`);
            console.log(convertException(ex));
            return;
        }

        const batches = lodashChunk(items, this.maxBatchSize);

        for (const batch of batches) {
            let cmd: BatchWriteCommand | undefined = undefined;
            do {
                const input: BatchWriteCommandInput = {
                    RequestItems: {
                        [table.name]: batch.map(item => {
                            return {
                                [requestType.name]: {
                                    [requestType.key]: item
                                }
                            };
                        })
                    }
                };
                cmd = new BatchWriteCommand(input);

                const retry = createRetry({
                    maxRetries: this.maxRetries,
                    retryDelay: this.retryDelay
                });

                await retry.retry(
                    async () => {
                        if (!cmd) {
                            return;
                        }
                        const result = await client.send(cmd);

                        if (!result.UnprocessedItems?.[table.name]) {
                            cmd = undefined;
                            return;
                        }
                        cmd = new BatchWriteCommand({
                            RequestItems: result.UnprocessedItems
                        });
                    },
                    {
                        onFail: async ex => {
                            console.error("Error executing batch write command.");
                            console.log(convertException(ex));
                        }
                    }
                );
            } while (cmd);
        }
    }

    private getRequestType(command: CommandType): IRequestType {
        switch (command) {
            case "put":
                return {
                    name: "PutRequest",
                    key: "Item"
                };

            case "delete":
                return {
                    name: "DeleteRequest",
                    key: "Key"
                };
            default:
                throw new Error(`Invalid command type: ${command}`);
        }
    }
}

export const createStorer = (params: IStorerParams): IStorer => {
    return new Storer(params);
};
