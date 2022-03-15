import {
    ValueTransformPlugin,
    ValueTransformPluginParams,
    ValueTransformPluginParamsTransformParams
} from "./ValueTransformPlugin";
import WebinyError from "@webiny/error";
import { parseISO } from "date-fns";

const transformDateTime = (params: ValueTransformPluginParamsTransformParams): number | null => {
    const { value } = params;
    if (value === null) {
        return null;
    }
    if (value && typeof (value as any).getTime === "function") {
        /**
         * In this case we assume this is a date object and we just get the time.
         */
        return (value as Date).getTime();
    }
    const parsedDateTime = parseISO(value).getTime();
    if (isNaN(parsedDateTime) === false) {
        return parsedDateTime;
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
