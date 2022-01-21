import ValidationError from "~/validationError";

interface ParsedTimeResult {
    hours: number;
    minutes: number;
    seconds: number;
}
const parseTime = (value: string): ParsedTimeResult => {
    const parsed = value.split(":").map(Number);
    if (parsed.length < 2) {
        throw new ValidationError(`Value "${value}" does not look like time.`);
    }
    const [hours, minutes, seconds = 0] = parsed;
    if (hours >= 24) {
        throw new ValidationError(
            `There cannot be more than 24 hours. Value parsed is "${value}".`
        );
    } else if (hours < 0) {
        throw new ValidationError(`Hours cannot go into negative. Value parsed is "${value}".`);
    } else if (minutes >= 60) {
        throw new ValidationError(
            `There cannot be more than 59 minutes. Value parsed is "${value}".`
        );
    } else if (minutes < 0) {
        throw new ValidationError(`Minutes cannot go into negative. Value parsed is "${value}".`);
    } else if (seconds >= 60) {
        throw new ValidationError(
            `There cannot be more than 59 seconds. Value parsed is "${value}".`
        );
    } else if (seconds < 0) {
        throw new ValidationError(`Seconds cannot go into negative. Value parsed is "${value}".`);
    }
    return {
        hours,
        minutes,
        seconds
    };
};
/**
 * returns 1 if time is greater than compareTo
 * returns 0 if they are equal
 * returns -1 if compareTo is greater than time
 */
export const compareTime = (time: string, compareTo: string): number => {
    const { hours: timeHours, minutes: timeMinutes, seconds: timeSeconds } = parseTime(time);
    const {
        hours: compareToHours,
        minutes: compareToMinutes,
        seconds: compareToSeconds
    } = parseTime(compareTo);
    if (timeHours > compareToHours) {
        return 1;
    }
    if (timeHours === compareToHours) {
        if (timeMinutes > compareToMinutes) {
            return 1;
        } else if (timeMinutes === compareToMinutes) {
            if (timeSeconds > compareToSeconds) {
                return 1;
            } else if (timeSeconds === compareToSeconds) {
                return 0;
            }
        }
    }
    return -1;
};
