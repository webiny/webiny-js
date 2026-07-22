import { GraphQLScalarType } from "graphql";
import WebinyError from "@webiny/error";

const re = /^([0-9]{2}):([0-9]{2})(:([0-9]{2}))?$/;

const parseTime = (value?: unknown) => {
    if (typeof value !== "string" || !value || value.match(re) === null) {
        throw new WebinyError("Value does not look like time.", "TIME_VALIDATION_ERROR", { value });
    }
    const parsed = value.split(":").map(Number);
    if (parsed.length < 2) {
        throw new WebinyError(`Could not parse the value.`, "TIME_VALIDATION_ERROR", { value });
    }
    const [hours, minutes, seconds = 0] = parsed;
    if (hours >= 24) {
        throw new WebinyError(`There cannot be more than 24 hours.`, "TIME_VALIDATION_ERROR", {
            value
        });
    } else if (minutes >= 60) {
        throw new WebinyError(`There cannot be more than 59 minutes.`, "TIME_VALIDATION_ERROR", {
            value
        });
    } else if (seconds >= 60) {
        throw new WebinyError(`There cannot be more than 59 seconds.`, "TIME_VALIDATION_ERROR", {
            value
        });
    }
    return {
        hours,
        minutes,
        seconds
    };
};

const convertToTime = (value: unknown): string => {
    const { hours, minutes, seconds } = parseTime(value);
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(
        seconds
    ).padStart(2, "0")}`;
};

export const TimeScalar = new GraphQLScalarType({
    name: "Time",
    description: "A custom type to support time-only input.",
    // sending to client
    serialize: convertToTime,
    // received from client
    parseValue: convertToTime
});
