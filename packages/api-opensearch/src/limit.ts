/**
 * This is the max limit of the OpenSearch.
 * Change here if it changes (and if it is necessary).
 */
const ES_LIMIT_MAX = 10000;
/**
 * Our system default limit.
 */
const ES_LIMIT_DEFAULT = 50;

export const createLimit = (limit?: number, defaultValue = ES_LIMIT_DEFAULT): number => {
    /**
     * Limit can possibly be null/undefined or less than 1.
     * In that case return the defaults.
     */
    if (!limit || limit < 1) {
        return defaultValue;
    }
    /**
     * Users input limit cannot be greater than the OpenSearch one.
     * OpenSearch query breaks because of that.
     */
    if (limit < ES_LIMIT_MAX) {
        return limit;
    }
    /**
     * Always reduce by 1 because we check if there are more items by adding 1 to the limit
     * and then remove that last one loaded.
     */
    return ES_LIMIT_MAX - 1;
};
