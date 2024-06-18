const recordsPerSecond = 4;
export const WAIT_MIN_SECONDS = 15;
export const WAIT_MAX_SECONDS = 90;

export const calculateSeconds = (records: number): number => {
    const seconds = Math.ceil(records / recordsPerSecond);
    if (seconds > WAIT_MAX_SECONDS) {
        return WAIT_MAX_SECONDS;
    } else if (seconds < WAIT_MIN_SECONDS) {
        return WAIT_MIN_SECONDS;
    } else if (seconds > 0) {
        return seconds;
    }
    return WAIT_MAX_SECONDS;
};
