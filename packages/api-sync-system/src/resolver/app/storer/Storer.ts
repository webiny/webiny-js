import type { IStoreItem, IStorer, IStorerExecParams } from "./types";
import type { IDeployment } from "~/resolver/deployment/types.js";
import type {
    DeleteCommandOutput,
    DynamoDBDocument,
    PutCommandOutput
} from "@webiny/aws-sdk/client-dynamodb/index.js";
import { DeleteCommand, PutCommand } from "@webiny/aws-sdk/client-dynamodb/index.js";
import { CommandType } from "~/types";
import type { ITable } from "~/sync/types.js";
import { createRetry } from "../utils/Retry";
import { convertException } from "@webiny/utils";

export interface IStorerParamsCreateDocumentClientCallable {
    (deployment: Pick<IDeployment, "region">): Pick<DynamoDBDocument, "send">;
}

export interface IStorerOnErrorParams {
    command: CommandType;
    item: IStoreItem;
    table: ITable;
    error: Error;
}

export interface IStorerOnErrorCb {
    (params: IStorerOnErrorParams): Promise<void>;
}

export interface ISingleStorerAfterEachParams {
    command: CommandType;
    target: IDeployment;
    source: IDeployment;
    table: ITable;
    item: IStoreItem;
}

export interface IStorerAfterEachCb {
    (params: ISingleStorerAfterEachParams): Promise<void>;
}

export interface IStorerParams {
    maxRetries?: number;
    retryDelay?: number;
    createDocumentClient: IStorerParamsCreateDocumentClientCallable;
    onError?: IStorerOnErrorCb;
    afterEach?: IStorerAfterEachCb;
}

export class Storer implements IStorer {
    private readonly maxRetries: number;
    private readonly retryDelay: number;
    private readonly createDocumentClient: IStorerParamsCreateDocumentClientCallable;
    private readonly afterEach?: IStorerAfterEachCb;
    private readonly onError?: IStorerOnErrorCb;

    public constructor(params: IStorerParams) {
        this.maxRetries = params.maxRetries || 10;
        this.retryDelay = params.retryDelay || 1000;
        this.createDocumentClient = params.createDocumentClient;
        this.afterEach = params.afterEach;
        this.onError = params.onError;
    }

    public async store(params: IStorerExecParams): Promise<void> {
        const { deployment, bundle, table, command, items } = params;
        if (items.length === 0) {
            return;
        }
        const client = this.createDocumentClient({
            region: deployment.region
        });

        const retry = createRetry({
            maxRetries: this.maxRetries,
            retryDelay: this.retryDelay
        });

        for (const item of items) {
            const result = await retry.retry(
                async (): Promise<DeleteCommandOutput | PutCommandOutput | null> => {
                    switch (command) {
                        case "delete":
                            return await client.send(
                                new DeleteCommand({
                                    TableName: table.name,
                                    Key: {
                                        PK: item.PK,
                                        SK: item.SK
                                    }
                                })
                            );
                        case "put":
                            return await client.send(
                                new PutCommand({
                                    TableName: table.name,
                                    Item: item
                                })
                            );

                        default:
                            console.error(`Unsupported command type: ${command}`);
                            return null;
                    }
                },
                {
                    onFail: async error => {
                        console.error("Error executing batch write command.");
                        console.log(convertException(error));
                        if (!this.onError) {
                            return;
                        }
                        try {
                            await this.onError({
                                item,
                                command,
                                table,
                                error
                            });
                        } catch (ex) {
                            console.error(`Error in onError callback for command: ${command}`);
                            console.log({
                                original: convertException(error),
                                error: convertException(ex)
                            });
                        }
                    }
                }
            );
            if (!result || !this.afterEach) {
                continue;
            }
            try {
                await this.afterEach({
                    table,
                    command,
                    item,
                    source: bundle.source,
                    target: deployment
                });
            } catch (ex) {
                console.error(`Error in afterEach callback for command: ${command}`);
                console.log(convertException(ex));
            }
        }
    }
}

export const createStorer = (params: IStorerParams): IStorer => {
    return new Storer(params);
};
