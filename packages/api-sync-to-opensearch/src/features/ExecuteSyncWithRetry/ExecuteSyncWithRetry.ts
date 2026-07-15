import pRetry from "p-retry";
import { ExecuteSync } from "../ExecuteSync/abstraction.js";
import { NotEnoughRemainingTimeError } from "~/NotEnoughRemainingTimeError.js";
import { ExecuteSyncWithRetry as ExecuteSyncWithRetryAbstraction } from "./abstraction.js";
import { Env } from "@webiny/stdlib";
import { Timer } from "@webiny/utils/features/Timer/abstraction.js";

const minRemainingSecondsToTimeout = 120;

class ExecuteSyncWithRetryImpl implements ExecuteSyncWithRetryAbstraction.Interface {
    public constructor(
        private readonly timer: Timer.Interface,
        private readonly executeSync: ExecuteSync.Interface,
        private readonly env: Env.Interface
    ) {}

    public async execute(params: ExecuteSyncWithRetryAbstraction.Params): Promise<void> {
        const maxProcessorPercent = this.env.getNumber(
            "MAX_ES_PROCESSOR",
            process.env.NODE_ENV === "test" ? 101 : 98
        );

        const maxRetryTime = this.env.getNumber(
            "WEBINY_DYNAMODB_TO_OPENSEARCH_MAX_RETRY_TIME",
            params.maxRetryTime || 300000
        );
        const retries = this.env.getNumber(
            "WEBINY_DYNAMODB_TO_OPENSEARCH_RETRIES",
            params.retries || 20
        );
        const minTimeout = this.env.getNumber(
            "WEBINY_DYNAMODB_TO_OPENSEARCH_MIN_TIMEOUT",
            params.minTimeout || 1500
        );
        const maxTimeout = this.env.getNumber(
            "WEBINY_DYNAMODB_TO_OPENSEARCH_MAX_TIMEOUT",
            params.maxTimeout || 30000
        );

        try {
            await pRetry(
                async () => {
                    await this.executeSync.execute({
                        maxRunningTime: params.maxRunningTime,
                        maxProcessorPercent: params.maxProcessorPercent || maxProcessorPercent,
                        operations: params.operations
                    });
                },
                {
                    maxRetryTime,
                    retries,
                    minTimeout,
                    maxTimeout,
                    onFailedAttempt: ({ error, attemptNumber }) => {
                        if (this.timer.getRemainingSeconds() < minRemainingSecondsToTimeout) {
                            throw new NotEnoughRemainingTimeError(error);
                        }
                        if (attemptNumber < retries * 0.75) {
                            return;
                        }
                        console.error(`Attempt #${attemptNumber} failed.`);
                        console.error(error);
                    }
                }
            );
        } catch (ex) {
            throw ex;
        }
    }
}

export const ExecuteSyncWithRetry = ExecuteSyncWithRetryAbstraction.createImplementation({
    implementation: ExecuteSyncWithRetryImpl,
    dependencies: [Timer, ExecuteSync, Env]
});
