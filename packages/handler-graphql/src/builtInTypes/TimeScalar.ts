import { GraphQLScalarType } from "graphql";
import WebinyError from "@webiny/error";

const parseTime = (value: string) => {
    const parsed = value.split(":").map(Number);
    if (parsed.length < 2) {
        throw new WebinyError(`Value "${value}" does not look like time.`);
    }
    const [hours, minutes, seconds = 0] = parsed;
    if (hours >= 24) {
        throw new WebinyError(`There cannot be more than 24 hours. Value parsed is "${value}".`);
    } else if (hours < 0) {
        throw new WebinyError(`Hours cannot go into negative. Value parsed is "${value}".`);
    } else if (minutes >= 60) {
        throw new WebinyError(`There cannot be more than 59 minutes. Value parsed is "${value}".`);
    } else if (minutes < 0) {
        throw new WebinyError(`Minutes cannot go into negative. Value parsed is "${value}".`);
    } else if (seconds >= 60) {
        throw new WebinyError(`There cannot be more than 59 seconds. Value parsed is "${value}".`);
    } else if (seconds < 0) {
        throw new WebinyError(`Seconds cannot go into negative. Value parsed is "${value}".`);
    }
    return {
        hours,
        minutes,
        seconds
    };
};

const convertToTime = (value: string): string => {
    const { hours, minutes, seconds } = parseTime(value);
    return `${hours}:${minutes}:${seconds}`;
};

export const TimeScalar = new GraphQLScalarType({
    name: "Time",
    description: "A custom type to support time-only input.",
    // sending to client
    serialize: convertToTime,
    // received from client
    parseValue: convertToTime
});
