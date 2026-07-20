import { parseISO } from "date-fns";
import type { FieldFilterValueTransformRegistry } from "../features/fieldFilterValueTransform/abstractions.js";

const transformTime = (value: any): number => {
    if (value === undefined || value === null) {
        throw new Error(`Time value is null or undefined.`);
    } else if (typeof value === "boolean" || value === "" || Array.isArray(value)) {
        throw new Error("Field value must be a string because field is defined as time.");
    }
    const converted = Number(`${value}`);
    if (typeof value === "number" || isNaN(converted) === false) {
        return Number(value);
    } else if (typeof value !== "string") {
        throw new Error("Field value must be a string because field is defined as time.");
    }
    const [time, milliseconds = 0] = value.split(".");
    const values = time.split(":").map(Number);
    if (values.length < 2) {
        throw new Error("Time must contain at least hours and minutes.");
    }
    const [hours, minutes, seconds = 0] = values;
    return (hours * 60 * 60 + minutes * 60 + seconds) * 1000 + Number(milliseconds);
};

const transformDateTime = (value: any): number | null => {
    if (value === null || value === undefined) {
        return null;
    } else if (typeof value === "string") {
        const parsedDateTime = parseISO(value).getTime();
        if (isNaN(parsedDateTime) === false) {
            return parsedDateTime;
        }
    } else if (value instanceof Date || typeof (value as unknown as Date)?.getTime === "function") {
        return value.getTime();
    }
    console.warn("Could not parse given dateTime value.", "PARSE_DATE_ERROR", {
        value
    });
    return null;
};

export const createDatetimeTransformHandler = (): FieldFilterValueTransformRegistry.Handler => {
    return {
        transform: ({ field, value }) => {
            const { type } = field.settings || {};
            if (type === "time") {
                return transformTime(value);
            }
            return transformDateTime(value);
        }
    };
};
