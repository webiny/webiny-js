import { execute, IExecuteParams } from "~/execute";
import { NotEnoughRemainingTimeError } from "~/NotEnoughRemainingTimeError";
import pRetry from "p-retry";
import { getNumberEnvVariable } from "./helpers/getNumberEnvVariable";

const minRemainingSecondsToTimeout = 120;

export interface IExecuteWithRetryParams extends IExecuteParams {
    maxRetryTime?: number;
    retries?: number;
    minTimeout?: number;
    maxTimeout?: number;
}

export const executeWithRetry = async (params: IExecuteWithRetryParams) => {
    const maxRetryTime = getNumberEnvVariable(
        "WEBINY_DYNAMODB_TO_ELASTICSEARCH_MAX_RETRY_TIME",
        params.maxRetryTime || 300000
    );
    const retries = getNumberEnvVariable(
        "WEBINY_DYNAMODB_TO_ELASTICSEARCH_RETRIES",
        params.retries || 20
    );
    const minTimeout = getNumberEnvVariable(
        "WEBINY_DYNAMODB_TO_ELASTICSEARCH_MIN_TIMEOUT",
        params.minTimeout || 1500
    );
    const maxTimeout = getNumberEnvVariable(
        "WEBINY_DYNAMODB_TO_ELASTICSEARCH_MAX_TIMEOUT",
        params.maxTimeout || 30000
    );

    try {
        await pRetry(
            execute({
                timer: params.timer,
                maxRunningTime: params.maxRunningTime,
                maxProcessorPercent: params.maxProcessorPercent,
                context: params.context,
                operations: params.operations
            }),
            {
                maxRetryTime,
                retries,
                minTimeout,
                maxTimeout,
                onFailedAttempt: error => {
                    if (params.timer.getRemainingSeconds() < minRemainingSecondsToTimeout) {
                        throw new NotEnoughRemainingTimeError(error);
                    }
                    /**
                     * We will only log attempts which are after 3/4 of total attempts.
                     */
                    if (error.attemptNumber < retries * 0.75) {
                        return;
                    }
                    console.error(`Attempt #${error.attemptNumber} failed.`);
                    console.error(error);
                }
            }
        );
    } catch (ex) {
        // TODO implement storing of failed operations
        throw ex;
    }
};
