import {
    createWaitUntilHealthy,
    ElasticsearchCatClusterHealthStatus,
    UnhealthyClusterError,
    WaitingHealthyClusterAbortedError
} from "@webiny/api-elasticsearch";
import { ITimer } from "@webiny/handler-aws";
import { ApiResponse, ElasticsearchContext } from "@webiny/api-elasticsearch/types";
import { WebinyError } from "@webiny/error";
import { IOperations } from "./types";

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
    context: Pick<ElasticsearchContext, "elasticsearch">;
    operations: IOperations;
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

export const execute = (params: IExecuteParams) => {
    return async (): Promise<void> => {
        const { context, timer, maxRunningTime, maxProcessorPercent, operations } = params;
        const remainingTime = timer.getRemainingSeconds();
        const runningTime = maxRunningTime - remainingTime;
        const maxWaitingTime = remainingTime - 90;

        if (process.env.DEBUG === "true") {
            console.debug(
                `The Lambda is already running for ${runningTime}s. Setting Health Check max waiting time: ${maxWaitingTime}s`
            );
        }

        const healthCheck = createWaitUntilHealthy(context.elasticsearch, {
            minClusterHealthStatus: ElasticsearchCatClusterHealthStatus.Yellow,
            waitingTimeStep: 30,
            maxProcessorPercent,
            maxWaitingTime
        });

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
            const res = await context.elasticsearch.bulk<BulkOperationsResponseBody>({
                body: operations.items
            });
            checkErrors(res);
        } catch (error) {
            if (process.env.DEBUG !== "true") {
                throw error;
            }
            const meta = error?.meta || {};
            delete meta["meta"];
            console.error("Bulk error", JSON.stringify(error, null, 2));
            throw error;
        }
        if (process.env.DEBUG !== "true") {
            return;
        }
        console.info(`Transferred ${operations.total} record operations to Elasticsearch.`);
    };
};
