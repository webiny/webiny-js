import {
    ValueTransformPlugin,
    ValueTransformPluginParams,
    ValueTransformPluginParamsTransformParams
} from "./ValueTransformPlugin";
import WebinyError from "@webiny/error";
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

    throw new WebinyError("Could not parse given dateTime value.", "PARSE_DATE_ERROR", {
        value
    });
};

export class DateTimeTransformPlugin extends ValueTransformPlugin {
    public constructor(params: Omit<ValueTransformPluginParams, "transform">) {
        super({
            transform: transformDateTime,
            ...params
        });
    }
}
