import type {
    ValueTransformPluginParams,
    ValueTransformPluginParamsTransformParams
} from "./ValueTransformPlugin.js";
import { ValueTransformPlugin } from "./ValueTransformPlugin.js";
import { parseISO } from "date-fns";

const transformDateTime = (params: ValueTransformPluginParamsTransformParams): number | null => {
    const { value } = params;
    if (value === null || value === undefined) {
        return null;
    } else if (typeof value === "string") {
        const parsedDateTime = parseISO(value).getTime();
        if (isNaN(parsedDateTime) === false) {
            return parsedDateTime;
        }
    } else if (value instanceof Date || typeof (value as unknown as Date)?.getTime === "function") {
        /**
         * In this case we assume this is a date object, and we just get the time.
         */
        return value.getTime();
    }
    /**
     * No point in throwing an error here, as this would cause the entire transformation to fail. Instead, we just log a warning and return null.
     */
    console.warn("Could not parse given dateTime value.", "PARSE_DATE_ERROR", {
        value
    });
    return null;
};

export class DateTimeTransformPlugin extends ValueTransformPlugin {
    public constructor(params: Omit<ValueTransformPluginParams, "transform">) {
        super({
            transform: transformDateTime,
            ...params
        });
    }
}
