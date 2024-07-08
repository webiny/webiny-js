const min = 15;
const max = 60;
const step = 5;
/**
 * This function will increase the backoff time exponentially with each iteration, after the minimum backoff time, ofc...
 */
export const getBackOffSeconds = (iterations: number) => {
    return Math.min(max, Math.max(min, iterations * step));
};
