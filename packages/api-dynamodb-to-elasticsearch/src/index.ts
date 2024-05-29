import WebinyError from "@webiny/error";
import { AttributeValue, unmarshall as baseUnmarshall } from "@webiny/aws-sdk/client-dynamodb";
import {
    createWaitUntilHealthy,
    decompress,
    IWaitOptionsOnUnhealthyParams
} from "@webiny/api-elasticsearch";
import { ApiResponse, ElasticsearchContext } from "@webiny/api-elasticsearch/types";
import { createDynamoDBEventHandler } from "@webiny/handler-aws";
import { ElasticsearchCatHealthStatus } from "@webiny/api-elasticsearch/operations/types";

enum Operations {
    INSERT = "INSERT",
    MODIFY = "MODIFY",
    REMOVE = "REMOVE"
}

interface BulkOperationsResponseBodyItemIndexError {
    reason?: string;
}

interface BulkOperationsResponseBodyItemIndex {
    error?: BulkOperationsResponseBodyItemIndexError;
}

interface BulkOperationsResponseBodyItem {
    index?: BulkOperationsResponseBodyItemIndex;
    error?: string;
}

interface BulkOperationsResponseBody {
    items: BulkOperationsResponseBodyItem[];
}

const getError = (item: BulkOperationsResponseBodyItem): string | null => {
    if (!item.index?.error?.reason) {
        return null;
    }
    const reason = item.index.error.reason;
    if (reason.match(/no such index \[([a-zA-Z0-9_-]+)\]/) !== null) {
        return "index";
    }
    return reason;
};

const getNumberEnvVariable = (name: string, def: number): number => {
    const input = process.env[name];
    const value = Number(input);
    if (value > 0) {
        return value;
    }
    return def;
};

const checkErrors = (result?: ApiResponse<BulkOperationsResponseBody>): void => {
    if (!result || !result.body || !result.body.items) {
        return;
    }
    for (const item of result.body.items) {
        const err = getError(item);
        if (!err) {
            continue;
        } else if (err === "index") {
            if (process.env.DEBUG === "true") {
                console.error("Bulk response", JSON.stringify(result, null, 2));
            }
            continue;
        }
        console.error(item.error);
        throw new WebinyError(err, "DYNAMODB_TO_ELASTICSEARCH_ERROR", item);
    }
};

interface RecordDynamoDbImage {
    data: Record<string, any>;
    ignore?: boolean;
    index: string;
}

interface RecordDynamoDbKeys {
    PK: string;
    SK: string;
}

const unmarshall = <T>(value?: Record<string, AttributeValue>): T | undefined => {
    if (!value) {
        return undefined;
    }
    return baseUnmarshall(value) as T;
};

export const createEventHandler = () => {
    return createDynamoDBEventHandler(async ({ event, context: ctx }) => {
        const context = ctx as unknown as ElasticsearchContext;
        if (!context.elasticsearch) {
            console.error("Missing elasticsearch definition on context.");
            return null;
        }

        const healthCheck = createWaitUntilHealthy(context.elasticsearch, {
            minStatus: ElasticsearchCatHealthStatus.Yellow,
            waitingTimeStep: 30,
            maxProcessorPercent: 85,
            maxWaitingTime: 810
        });

        /**
         * Wrap the code we need to run into the function, so it can be called within itself.
         */
        const execute = async (): Promise<void> => {
            const operations = [];

            for (const record of event.Records) {
                const dynamodb = record.dynamodb;
                if (!dynamodb) {
                    continue;
                }
                /**
                 * TODO: figure out correct types
                 */
                // @ts-expect-error
                const newImage = unmarshall<RecordDynamoDbImage>(dynamodb.NewImage);

                // Note that with the `REMOVE` event, there is no `NewImage` property. Which means,
                // if the `newImage` is `undefined`, we are dealing with a `REMOVE` event and we still
                // need to process it.
                if (newImage && newImage.ignore === true) {
                    continue;
                }
                /**
                 * TODO: figure out correct types
                 */
                // @ts-expect-error
                const keys = unmarshall<RecordDynamoDbKeys>(dynamodb.Keys);
                if (!keys?.PK || !keys.SK) {
                    continue;
                }
                const _id = `${keys.PK}:${keys.SK}`;
                /**
                 * TODO: figure out correct types
                 */
                // @ts-expect-error
                const oldImage = unmarshall<RecordDynamoDbImage>(dynamodb.OldImage);
                const operation = record.eventName;

                /**
                 * On operations other than REMOVE we decompress the data and store it into the Elasticsearch.
                 * No need to try to decompress if operation is REMOVE since there is no data sent into that operation.
                 */
                let data: any = undefined;
                if (newImage && operation !== Operations.REMOVE) {
                    /**
                     * We must decompress the data that is going into the Elasticsearch.
                     */
                    data = await decompress(context.plugins, newImage.data);
                    /**
                     * No point in writing null or undefined data into the Elasticsearch.
                     * This might happen on some error while decompressing. We will log it.
                     *
                     * Data should NEVER be null or undefined in the Elasticsearch DynamoDB table, unless it is a delete operations.
                     * If it is - it is a bug.
                     */
                    if (data === undefined || data === null) {
                        console.error(
                            `Could not get decompressed data, skipping ES operation "${operation}", ID ${_id}`
                        );
                        continue;
                    }
                }

                switch (record.eventName) {
                    case Operations.INSERT:
                    case Operations.MODIFY:
                        if (newImage) {
                            operations.push(
                                {
                                    index: {
                                        _id,
                                        _index: newImage.index
                                    }
                                },
                                data
                            );
                        }
                        break;
                    case Operations.REMOVE:
                        operations.push({
                            delete: {
                                _id,
                                _index: oldImage?.index || "unknown"
                            }
                        });
                        break;
                    default:
                        break;
                }
            }

            if (!operations.length) {
                return;
            }

            try {
                await healthCheck.wait({
                    async onUnhealthy({ startedAt, runs, mustEndAt, waitingTimeStep }) {
                        console.warn(`Cluster is unhealthy on run #${runs}.`, {
                            startedAt,
                            mustEndAt,
                            waitingTimeStep
                        });
                    },
                    async onTimeout({ startedAt, runs, waitingTimeStep, mustEndAt }) {
                        console.error(`Cluster health check timeout on run #${runs}.`, {
                            startedAt,
                            mustEndAt,
                            waitingTimeStep
                        });
                    }
                });
            } catch (ex) {
                // TODO implement retrying...?
                throw ex;
            }

            try {
                const res = await context.elasticsearch.bulk<BulkOperationsResponseBody>({
                    body: operations
                });
                checkErrors(res);
            } catch (error) {
                if (process.env.DEBUG === "true") {
                    const meta = error?.meta || {};
                    delete meta["meta"];
                    console.error("Bulk error", JSON.stringify(error, null, 2));
                }
                throw error;
            }
        };

        try {
            await execute();
        } catch (ex) {
            console.error(`Could not insert data into Elasticsearch/OpenSearch.`);
            console.error(ex);
            throw ex;
        }

        return null;
    });
};
