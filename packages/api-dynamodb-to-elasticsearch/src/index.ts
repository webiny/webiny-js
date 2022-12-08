import WebinyError from "@webiny/error";
import { Converter } from "aws-sdk/clients/dynamodb";
import { decompress } from "@webiny/api-elasticsearch";
import { ApiResponse, ElasticsearchContext } from "@webiny/api-elasticsearch/types";
import { createDynamoDBEventHandler } from "@webiny/handler-aws";
import { StreamRecord } from "aws-lambda/trigger/dynamodb-stream";

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
    if (!item.index || !item.index.error || !item.index.error.reason) {
        return null;
    }
    const reason = item.index.error.reason;
    if (reason.match(/no such index \[([a-zA-Z0-9_-]+)\]/) !== null) {
        return "index";
    }
    return reason;
};

interface BulkError extends Error {
    name: string;
    meta?: {
        body?: string;
        statusCode?: number;
    };
}

const isBulkError = (error: BulkError): boolean => {
    /**
     * Let's check for some properties / values which we know exist in the too many requests error.
     */
    if (error.name !== "ResponseError" || !error.meta?.body || !error.meta?.statusCode) {
        return false;
    }
    /**
     * Then we check for the status code and body for known values.
     */
    const statusCode = Number(error.meta.statusCode);
    const body = String(error.meta.body);

    return statusCode === 429 && body.match(/Too Many Requests/i) !== null;
};

const getNumberEnvVariable = (name: string, def: number): number => {
    const input = process.env[name];
    const value = Number(input);
    if (value > 0) {
        return value;
    }
    return def;
};

const MAX_ITERATIONS = getNumberEnvVariable("WEBINY_DYNAMODB_TO_ELASTICSEARCH_MAX_ITERATIONS", 10);
const WAITING_INTERVAL = getNumberEnvVariable(
    "WEBINY_DYNAMODB_TO_ELASTICSEARCH_WAITING_INTERVAL",
    2000
);

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
                console.log("Bulk response", JSON.stringify(result, null, 2));
            }
            continue;
        }
        console.log(item.error);
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

export const createEventHandler = () => {
    return createDynamoDBEventHandler(async ({ event, context: ctx }) => {
        const context = ctx as unknown as ElasticsearchContext;
        if (!context.elasticsearch) {
            console.log("Missing elasticsearch definition on context.");
            return null;
        }

        let currentIteration = 1;

        /**
         * Wrap the code we need to run into the function, so it can be called within itself.
         */
        const execute = async (): Promise<void> => {
            const operations = [];

            for (const record of event.Records) {
                const dynamodb = record.dynamodb as Required<StreamRecord>;
                if (!dynamodb) {
                    continue;
                }
                const newImage = Converter.unmarshall(dynamodb.NewImage) as RecordDynamoDbImage;

                if (newImage.ignore === true) {
                    continue;
                }

                const oldImage = Converter.unmarshall(dynamodb.OldImage) as RecordDynamoDbImage;
                const keys = Converter.unmarshall(dynamodb.Keys) as RecordDynamoDbKeys;
                const _id = `${keys.PK}:${keys.SK}`;
                const operation = record.eventName;

                /**
                 * On operations other than REMOVE we decompress the data and store it into the Elasticsearch.
                 * No need to try to decompress if operation is REMOVE since there is no data sent into that operation.
                 */
                let data: any = undefined;
                if (operation !== Operations.REMOVE) {
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
                        console.log(
                            `Could not get decompressed data, skipping ES operation "${operation}", ID ${_id}`
                        );
                        continue;
                    }
                }

                switch (record.eventName) {
                    case Operations.INSERT:
                    case Operations.MODIFY:
                        operations.push({ index: { _id, _index: newImage.index } }, data);
                        break;
                    case Operations.REMOVE:
                        operations.push({ delete: { _id, _index: oldImage.index } });
                        break;
                    default:
                        break;
                }
            }

            if (!operations.length) {
                return;
            }

            try {
                const res = await context.elasticsearch.bulk<BulkOperationsResponseBody>({
                    body: operations
                });
                checkErrors(res);
                if (process.env.DEBUG === "true") {
                    console.log("Bulk response", JSON.stringify(res, null, 2));
                }
            } catch (error) {
                /**
                 * Bulk error must trigger execution again, in WAITING_INTERVAL milliseconds after last error
                 */
                if (isBulkError(error)) {
                    if (currentIteration < MAX_ITERATIONS) {
                        console.log(
                            `Bulk error`,
                            JSON.stringify(
                                {
                                    message:
                                        "Error while inserting data into Elasticsearch. Retrying...",
                                    iteration: currentIteration
                                },
                                null,
                                2
                            )
                        );
                        /**
                         * We need to sleep a bit.
                         */
                        await new Promise(resolve => {
                            return setTimeout(resolve, WAITING_INTERVAL);
                        });
                        /**
                         * And then execute again.
                         */
                        currentIteration++;
                        await execute();
                        return;
                    }
                    console.log(
                        `Bulk error`,
                        JSON.stringify(
                            {
                                message:
                                    "Error while inserting data into the Elasticsearch. Max retries reached.",
                                error
                            },
                            null,
                            2
                        )
                    );
                    return;
                }
                if (process.env.DEBUG === "true") {
                    console.log("Bulk error", JSON.stringify(error, null, 2));
                }
                throw error;
            }
        };

        await execute();

        return null;
    });
};
