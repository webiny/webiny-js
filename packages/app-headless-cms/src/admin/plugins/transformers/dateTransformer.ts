import { CmsFieldValueTransformer } from "~/types";
import WebinyError from "@webiny/error";

interface ThrowTransformErrorParams {
    ex: WebinyError;
    type: string;
    value: string;
}
const throwTransformError = (params: ThrowTransformErrorParams): WebinyError => {
    const { type, value, ex: error } = params;
    return new WebinyError(`Could not transform value to a date.`, "TRANSFORM_ERROR", {
        error,
        type,
        value
    });
};

const dateOnly = (value?: string): string | null => {
    if (!value) {
        return null;
    }
    try {
        const date = new Date(value).toISOString();
        return date.substr(0, 10);
    } catch (ex) {
        throw throwTransformError({
            ex,
            value,
            type: "date"
        });
    }
};

const extractTimeZone = (value?: string): [string, string] => {
    let result: string[];
    if (!value) {
        return [new Date().toISOString(), "00:00"];
    } else if (value.includes("+")) {
        result = value.split("+");
    } else {
        result = value.split("-");
    }
    if (!result || result.length !== 2) {
        throw new WebinyError(
            `Could not determine time and timezone out of given value.`,
            "TIME_ZONE_ERROR",
            {
                value
            }
        );
    }
    return result as [string, string];
};

const extractTime = (value?: string): string | null => {
    if (!value) {
        return null;
    } else if (value.includes(":") === false) {
        throw new WebinyError("Time value is missing : separators.", "TIME_ERROR", {
            value
        });
    }
    const result = value.split(":");
    if (result.length === 3) {
        return value;
    } else if (result.length === 2) {
        return `${value}:00`;
    }
    return null;
};

const dateTimeWithTimezone = (value?: string): string => {
    if (!value) {
        return null;
    } else if (value.includes("T") === false) {
        return value;
    }

    const [initialDate, initialTimeZone] = value.split("T");

    let date: string;

    try {
        const dateObj = new Date(initialDate);
        date = dateObj.toISOString().substr(0, 10);
    } catch (ex) {
        throw new WebinyError(
            "Could not transform received date into Date object.",
            "DATE_TRANSFORM_ERROR",
            {
                value,
                date: initialDate,
                time: initialTimeZone
            }
        );
    }
    const [initialTime] = extractTimeZone(initialTimeZone);

    const time = extractTime(initialTime);

    return value.replace(initialDate, date).replace(initialTime, time);
};

const dateTimeWithoutTimezone = (value?: string): string | null => {
    if (!value) {
        return null;
    } else if (value.includes(" ") === false) {
        return value;
    }
    try {
        return new Date(`${value.replace(" ", "T")}.000Z`).toISOString();
    } catch (ex) {
        throw throwTransformError({
            ex,
            value,
            type: "dateTimeWithoutTimezone"
        });
    }
};

const time = (value?: string) => {
    if (!value) {
        return null;
    }
    return extractTime(value);
};

const transformers = {
    time,
    date: dateOnly,
    dateTimeWithoutTimezone,
    dateTimeWithTimezone
};

export default (): CmsFieldValueTransformer => ({
    type: "cms-field-value-transformer",
    name: "cms-field-value-transformer-date",
    fieldType: "datetime",
    transform: (value, field) => {
        // check types in packages/app-headless-cms/src/admin/plugins/fieldRenderers/dateTime/dateTimeField.tsx
        const type = field.settings.type;
        const transform = transformers[type];

        if (!transform) {
            return value;
        }

        return transform(value);
    }
});
