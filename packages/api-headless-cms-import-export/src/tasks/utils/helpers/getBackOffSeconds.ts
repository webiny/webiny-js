export const min = 10;
export const max = 90;
export const step = 10;
/**
 * This function will increase the backoff time exponentially with each iteration, after the minimum backoff time, ofc...
 */
export const getBackOffSeconds = (iterations: number) => {
    return Math.min(max, Math.max(min, iterations * step));
};
