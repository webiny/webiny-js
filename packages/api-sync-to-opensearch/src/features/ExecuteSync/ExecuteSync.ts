import {
    createWaitUntilHealthy,
    OpenSearchCatClusterHealthStatus,
    UnhealthyClusterError,
    WaitingHealthyClusterAbortedError
} from "@webiny/api-opensearch";
import type { ApiResponse } from "@webiny/api-opensearch/types.js";
import { WebinyError } from "@webiny/error";
import { ExecuteSync as ExecuteSyncAbstraction } from "./abstraction.js";
import { Env } from "@webiny/stdlib";
import { Timer } from "@webiny/utils/features/Timer/abstraction.js";
import { OpenSearchClient } from "@webiny/api-opensearch/exports/api/opensearch.js";

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
        throw new WebinyError(err, "TO_OPENSEARCH_ERROR", item);
    }
};

class ExecuteSyncImpl implements ExecuteSyncAbstraction.Interface {
    public constructor(
        private readonly env: Env.Interface,
        private readonly timer: Timer.Interface,
        private readonly openSearchClient: OpenSearchClient.Interface
    ) {}

    public async execute(params: ExecuteSyncAbstraction.Params): Promise<void> {
        const { maxProcessorPercent, maxRunningTime, operations } = params;

        if (operations.total === 0) {
            return;
        }

        const remainingTime = this.timer.getRemainingSeconds();
        const runningTime = maxRunningTime - remainingTime;
        const maxWaitingTime = remainingTime - 90;

        if (this.shouldShowLogs()) {
            console.debug(
                `The Lambda is already running for ${runningTime}s. Setting Health Check max waiting time: ${maxWaitingTime}s`
            );
        }

        const healthCheck = createWaitUntilHealthy(this.openSearchClient.use(), {
            minClusterHealthStatus: OpenSearchCatClusterHealthStatus.Yellow,
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
            const res = await this.openSearchClient.use().bulk({
                body: operations.items
            });
            checkErrors(res);
        } catch (error) {
            console.error(error, { tenant: "root" });

            if (this.shouldShowLogs()) {
                const meta = error?.meta || {};
                delete meta["meta"];
                console.error("Bulk error", JSON.stringify(error, null, 2));
            }
            throw error;
        }
        if (this.shouldShowLogs()) {
            console.info(`Transferred ${operations.total} record operations to OpenSearch.`);
        }
    }

    private shouldShowLogs(): boolean {
        /**
         * Don't show logs during tests, really no point.
         */
        if (this.env.getBoolean("TESTING")) {
            return false;
        }
        return this.env.getBoolean("DEBUG", false);
    }
}

export const ExecuteSync = ExecuteSyncAbstraction.createImplementation({
    implementation: ExecuteSyncImpl,
    dependencies: [Env, Timer, OpenSearchClient]
});
