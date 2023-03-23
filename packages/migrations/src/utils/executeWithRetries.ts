import pRetry from "p-retry";

export const executeWithRetries = (execute: () => void, options?: Parameters<typeof pRetry>[1]) => {
    const retries = 20;
    return pRetry(execute, {
        maxRetryTime: 300000,
        retries,
        minTimeout: 1500,
        maxTimeout: 30000,
        ...options
    });
};
