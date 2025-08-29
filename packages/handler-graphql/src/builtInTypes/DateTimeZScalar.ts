import { DateTimeResolver } from "graphql-scalars";
import { GraphQLScalarType } from "graphql";
import WebinyError from "@webiny/error";

const validateTimeZone = (value: string): void => {
    const timeWithTimezone = value.split("T")[1];
    if (!timeWithTimezone) {
        throw new WebinyError(
            "Could not extract time with timezone from value.",
            "DATE_TIME_TIMEZONE_ERROR",
            {
                value
            }
        );
    }
    const separator = timeWithTimezone.includes("-") ? "-" : "+";
    const zone = timeWithTimezone.split(separator)[1];
    if (!zone) {
        throw new WebinyError(
            "Could not extract timezone from value.",
            "DATE_TIME_TIMEZONE_ERROR",
            {
                value: timeWithTimezone
            }
        );
    }
    const hoursMinutes = zone.split(":");
    const [hours, minutes] = hoursMinutes;
    if (hours === undefined || minutes === undefined || hoursMinutes.length !== 2) {
        throw new WebinyError(
            "Could not extract hours or minutes from value.",
            "DATE_TIME_TIMEZONE_ERROR",
            {
                value: zone
            }
        );
    }
};
/**
 * A custom type for dateTime with the timezone.
 * Must be in format "YYYY-MM-ddTHH:mm:ss+HH:mm".
 */
export const DateTimeZScalar = new GraphQLScalarType({
    name: "DateTimeZ",
    description: "A custom type for dateTime with the timezone.",
    parseValue: value => {
        // this serves as validator
        DateTimeResolver.parseValue(value);
        validateTimeZone(value as string);
        return value;
    },
    serialize: value => {
        return value;
    }
});
