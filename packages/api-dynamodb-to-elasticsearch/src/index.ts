import WebinyError from "@webiny/error";
import { Converter } from "aws-sdk/clients/dynamodb";
import { decompress } from "@webiny/api-elasticsearch";
import { ApiResponse, ElasticsearchContext } from "@webiny/api-elasticsearch/types";
import { createDynamoDBEventHandler } from "@webiny/handler-aws";
import { StreamRecord } from "aws-lambda/trigger/dynamodb-stream";
import pRetry from "p-retry";

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
            } catch (error) {
                if (process.env.DEBUG === "true") {
                    const meta = error?.meta || {};
                    delete meta["meta"];
                    console.log("Bulk error", JSON.stringify(meta, null, 2));
                }
                throw error;
            }
        };

        const maxRetryTime = getNumberEnvVariable(
            "WEBINY_DYNAMODB_TO_ELASTICSEARCH_MAX_RETRY_TIME",
            300000
        );
        const retries = getNumberEnvVariable("WEBINY_DYNAMODB_TO_ELASTICSEARCH_RETRIES", 20);
        const minTimeout = getNumberEnvVariable(
            "WEBINY_DYNAMODB_TO_ELASTICSEARCH_MIN_TIMEOUT",
            1500
        );
        const maxTimeout = getNumberEnvVariable(
            "WEBINY_DYNAMODB_TO_ELASTICSEARCH_MAX_TIMEOUT",
            30000
        );

        await pRetry(execute, {
            maxRetryTime,
            retries,
            minTimeout,
            maxTimeout,
            onFailedAttempt: error => {
                /**
                 * We will only log attempts which are after 3/4 of total attempts.
                 */
                if (error.attemptNumber < retries * 0.75) {
                    return;
                }
                console.log(`Attempt #${error.attemptNumber} failed.`);
                console.log(error.message);
            }
        });

        return null;
    });
};
