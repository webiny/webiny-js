const recordsPerSecond = 4;
const maxSeconds = 60;

export const calculateSeconds = (records: number): number | null => {
    const seconds = Math.ceil(records / recordsPerSecond);
    if (seconds > maxSeconds) {
        return maxSeconds;
    } else if (seconds > 0) {
        return seconds;
    }
    return null;
};
