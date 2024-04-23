// TODO change to 600 before commit
const defaultTimeoutInSeconds = 60000;
/**
 * In milliseconds.
 */
export const getTimeout = () => {
    const userDefined = process.env.WEBINY_RECORD_LOCK_TIMEOUT
        ? parseInt(process.env.WEBINY_RECORD_LOCK_TIMEOUT)
        : undefined;
    if (!userDefined || isNaN(userDefined) || userDefined <= 0) {
        return defaultTimeoutInSeconds * 1000;
    }
    return userDefined * 1000;
};
