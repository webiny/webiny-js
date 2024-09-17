import pRetry from "p-retry";

export type ExecuteWithRetryOptions = Parameters<typeof pRetry>[1];

export const executeWithRetry = <T>(
    execute: () => Promise<T>,
    options?: ExecuteWithRetryOptions
) => {
    const retries = 20;
    return pRetry(execute, {
        maxRetryTime: 300000,
        retries,
        minTimeout: 1500,
        maxTimeout: 30000,
        ...options
    });
};
