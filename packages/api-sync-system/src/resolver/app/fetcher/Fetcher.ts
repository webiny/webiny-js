import type { IFetcher, IFetcherExecParams, IFetcherExecResult } from "./types";
import type { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb/index.js";
import { BatchGetCommand } from "@webiny/aws-sdk/client-dynamodb/index.js";
import lodashChunk from "lodash/chunk";
import type { IDeployment } from "~/resolver/deployment/types.js";
import { SourceDataContainer } from "~/resolver/app/data/SourceDataContainer.js";
import type { GenericRecord } from "@webiny/api/types.js";
import { convertException } from "@webiny/utils";
import type { IStoreItem } from "~/resolver/app/storer/types.js";
import type { ITable } from "~/sync/types.js";
import { createRetry } from "~/resolver/app/utils/Retry.js";

export interface IFetcherParamsCreateDocumentClientCallable {
    (deployment: Pick<IDeployment, "region">): Pick<DynamoDBDocument, "send">;
}

export interface IFetcherParams {
    maxRetries?: number;
    retryDelay?: number;
    createDocumentClient: IFetcherParamsCreateDocumentClientCallable;
}

interface IKeys {
    PK: string;
    SK: string;
}

interface IFetcherExecuteRunCommandParams {
    command: BatchGetCommand;
    table: string;
    client: Pick<DynamoDBDocument, "send">;
}

interface IFetcherExecuteRunCommandResult<T = GenericRecord> {
    items: T[];
    unprocessedKeys: IKeys[];
}

interface IFetchExecuteExecuteParamsItem {
    PK: string;
    SK: string;
}

interface IFetchExecuteExecuteParams {
    maxBatchSize: number;
    client: Pick<DynamoDBDocument, "send">;
    table: ITable;
    records: IFetchExecuteExecuteParamsItem[];
}

export class Fetcher implements IFetcher {
    private readonly createDocumentClient: IFetcherParamsCreateDocumentClientCallable;
    private readonly maxRetries: number;
    private readonly retryDelay: number;

    public constructor(params: IFetcherParams) {
        this.createDocumentClient = params.createDocumentClient;
        this.maxRetries = params.maxRetries || 10;
        this.retryDelay = params.retryDelay || 1000;
    }

    public async exec(params: IFetcherExecParams): Promise<IFetcherExecResult> {
        const { deployment, items: input, table, maxBatchSize = 25 } = params;
        if (input.length === 0) {
            return {
                items: SourceDataContainer.create()
            };
        }

        const client = this.createDocumentClient(deployment);

        const results = await this.execute({
            client,
            table,
            maxBatchSize,
            records: input
        });

        const items = SourceDataContainer.create();

        for (const item of input) {
            const data = results.find(result => {
                return item.PK === result.PK && item.SK === result.SK;
            });
            items.add(
                {
                    PK: item.PK,
                    SK: item.SK,
                    table,
                    source: deployment
                },
                data || null
            );
        }

        return {
            items
        };
    }

    private async execute<T = IStoreItem>(params: IFetchExecuteExecuteParams) {
        const { client, table, records: items, maxBatchSize } = params;
        const batches = lodashChunk(items, maxBatchSize);

        const results: T[] = [];
        for (const batch of batches) {
            let keys = this.getKeys(batch);

            while (keys.length > 0) {
                const command = new BatchGetCommand({
                    RequestItems: {
                        [table.name]: {
                            Keys: keys
                        }
                    }
                });
                const { items, unprocessedKeys } = await this.runCommand<T>({
                    command,
                    client,
                    table: table.name
                });

                results.push(...items);

                keys = unprocessedKeys;
            }
        }
        return results;
    }

    private async runCommand<T = GenericRecord>(
        params: IFetcherExecuteRunCommandParams
    ): Promise<IFetcherExecuteRunCommandResult<T>> {
        const { command, table, client } = params;

        const retry = createRetry({
            maxRetries: this.maxRetries,
            retryDelay: this.retryDelay
        });

        return await retry.retry(
            async () => {
                const result = await client.send(command);

                return {
                    items: (result.Responses?.[table] || []) as T[],
                    unprocessedKeys: (result.UnprocessedKeys?.[table]?.Keys || []) as IKeys[]
                };
            },
            {
                onFail: ex => {
                    console.error(
                        `Max retries reached. Could not fetch items from table: ${table}`
                    );
                    console.log(convertException(ex));
                    console.log(JSON.stringify(command));
                }
            }
        );
    }

    private getKeys(items: IFetchExecuteExecuteParamsItem[]): IKeys[] {
        const keys = new Map<string, IKeys>();

        for (const item of items) {
            const key = `PK:${item.PK}#SK:${item.SK}`;
            if (keys.has(key)) {
                continue;
            }
            keys.set(key, {
                PK: item.PK,
                SK: item.SK
            });
        }

        return Array.from(keys.values());
    }
}

export const createFetcher = (params: IFetcherParams): IFetcher => {
    return new Fetcher(params);
};
