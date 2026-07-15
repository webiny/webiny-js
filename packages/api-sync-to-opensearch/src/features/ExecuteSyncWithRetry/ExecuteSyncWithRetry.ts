import pRetry from "p-retry";
import { ExecuteSync } from "../ExecuteSync/abstraction.js";
import { NotEnoughRemainingTimeError } from "~/NotEnoughRemainingTimeError.js";
import { getNumberEnvVariable } from "~/helpers/getNumberEnvVariable.js";
import { ExecuteSyncWithRetry as ExecuteSyncWithRetryAbstraction } from "./abstraction.js";

const minRemainingSecondsToTimeout = 120;

const MAX_PROCESSOR_PERCENT = getNumberEnvVariable(
    "MAX_ES_PROCESSOR",
    process.env.NODE_ENV === "test" ? 101 : 98
);

class ExecuteSyncWithRetryImpl implements ExecuteSyncWithRetryAbstraction.Interface {
    public constructor(private readonly executeSync: ExecuteSync.Interface) {}

    public async execute(params: ExecuteSyncWithRetryAbstraction.Params): Promise<void> {
        const maxRetryTime = getNumberEnvVariable(
            "WEBINY_DYNAMODB_TO_OPENSEARCH_MAX_RETRY_TIME",
            params.maxRetryTime || 300000
        );
        const retries = getNumberEnvVariable(
            "WEBINY_DYNAMODB_TO_OPENSEARCH_RETRIES",
            params.retries || 20
        );
        const minTimeout = getNumberEnvVariable(
            "WEBINY_DYNAMODB_TO_OPENSEARCH_MIN_TIMEOUT",
            params.minTimeout || 1500
        );
        const maxTimeout = getNumberEnvVariable(
            "WEBINY_DYNAMODB_TO_OPENSEARCH_MAX_TIMEOUT",
            params.maxTimeout || 30000
        );

        try {
            await pRetry(
                async () => {
                    await this.executeSync.execute({
                        timer: params.timer,
                        maxRunningTime: params.maxRunningTime,
                        maxProcessorPercent: params.maxProcessorPercent || MAX_PROCESSOR_PERCENT,
                        openSearchClient: params.openSearchClient,
                        operations: params.operations
                    });
                },
                {
                    maxRetryTime,
                    retries,
                    minTimeout,
                    maxTimeout,
                    onFailedAttempt: ({ error, attemptNumber }) => {
                        if (params.timer.getRemainingSeconds() < minRemainingSecondsToTimeout) {
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
    dependencies: [ExecuteSync]
});
