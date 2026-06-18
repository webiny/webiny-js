import {
    createWaitUntilHealthy,
    OpenSearchCatClusterHealthStatus,
    UnhealthyClusterError,
    WaitingHealthyClusterAbortedError
} from "@webiny/api-opensearch";
import type { ITimer } from "@webiny/handler-aws";
import type { ApiResponse } from "@webiny/api-opensearch/types.js";

import { WebinyError } from "@webiny/error";
import type { IOperations } from "./types.js";
import { shouldShowLogs } from "~/helpers/shouldShowLogs.js";
import { OpenSearchClient } from "@webiny/api-opensearch/exports/api/opensearch.js";

export interface BulkOperationsResponseBodyItemIndexError {
    reason?: string;
}

export interface BulkOperationsResponseBodyItemIndex {
    error?: BulkOperationsResponseBodyItemIndexError;
}

export interface BulkOperationsResponseBodyItem {
    index?: BulkOperationsResponseBodyItemIndex;
    error?: string;
}

export interface BulkOperationsResponseBody {
    items: BulkOperationsResponseBodyItem[];
}

export interface IExecuteParams {
    timer: ITimer;
    maxRunningTime: number;
    maxProcessorPercent: number;
    opensearch: OpenSearchClient.Client;
    operations: Pick<IOperations, "items" | "total">;
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

const checkErrors = (result?: ApiResponse): void => {
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
        console.error("Body item with error", item);
        throw new WebinyError(err, "DYNAMODB_TO_OPENSEARCH_ERROR", item);
    }
};

export const execute = (params: IExecuteParams) => {
    return async (): Promise<void> => {
        const { opensearch, timer, maxRunningTime, maxProcessorPercent, operations } = params;

        if (operations.total === 0) {
            return;
        }

        const remainingTime = timer.getRemainingSeconds();
        const runningTime = maxRunningTime - remainingTime;
        const maxWaitingTime = remainingTime - 90;

        if (shouldShowLogs()) {
            console.debug(
                `The Lambda is already running for ${runningTime}s. Setting Health Check max waiting time: ${maxWaitingTime}s`
            );
        }

        const healthCheck = createWaitUntilHealthy(opensearch, {
            minClusterHealthStatus: OpenSearchCatClusterHealthStatus.Yellow,
            waitingTimeStep: 30,
            maxProcessorPercent,
            maxWaitingTime
        });

        // const log = context.logger.withSource("dynamodbToElasticsearch");
        const log = {
            notice: (...params: any[]) => {
                console.log(...params);
            },
            debug: (...params: any[]) => {
                console.debug(...params);
            },
            info: (...params: any[]) => {
                console.info(...params);
            },
            warn: (...params: any[]) => {
                console.warn(...params);
            },
            error: (...params: any[]) => {
                console.error(...params);
            }
        };

        try {
            await healthCheck.wait({
                async onUnhealthy({ startedAt, runs, mustEndAt, waitingTimeStep, waitingReason }) {
                    console.debug(`Cluster is unhealthy on run #${runs}.`, {
                        startedAt,
                        mustEndAt,
                        waitingTimeStep,
                        waitingReason
                    });
                },
                async onTimeout({ startedAt, runs, waitingTimeStep, mustEndAt, waitingReason }) {
                    console.error(`Cluster health check timeout on run #${runs}.`, {
                        startedAt,
                        mustEndAt,
                        waitingTimeStep,
                        waitingReason
                    });
                }
            });
        } catch (ex) {
            if (
                ex instanceof UnhealthyClusterError ||
                ex instanceof WaitingHealthyClusterAbortedError
            ) {
                throw ex;
            }
            console.error(`Cluster health check failed.`, ex);
            throw ex;
        }

        try {
            const res = await opensearch.bulk({
                body: operations.items
            });
            checkErrors(res);
        } catch (error) {
            log.error(error, {
                tenant: "root"
            });

            if (shouldShowLogs() === false) {
                throw error;
            }
            const meta = error?.meta || {};
            delete meta["meta"];
            console.error("Bulk error", JSON.stringify(error, null, 2));
            throw error;
        }
        if (shouldShowLogs() === false) {
            return;
        }
        console.info(`Transferred ${operations.total} record operations to Elasticsearch.`);
    };
};
