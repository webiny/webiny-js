import {
    ValueTransformPlugin,
    ValueTransformPluginParams,
    ValueTransformPluginParamsTransformParams
} from "./ValueTransformPlugin";
import WebinyError from "@webiny/error";

const transformTime = (params: ValueTransformPluginParamsTransformParams): number => {
    const { value } = params;
    if (value === undefined || value === null) {
        throw new WebinyError(`Time value is null or undefined.`, "TIME_PARSE_ERROR", {
            value
        });
    } else if (typeof value === "boolean" || value === "" || Array.isArray(value)) {
        throw new WebinyError(
            "Field value must be a string because field is defined as time.",
            "TIME_PARSE_ERROR",
            {
                value
            }
        );
    }
    const converted = Number(`${value}`);
    if (typeof value === "number" || isNaN(converted) === false) {
        return Number(value);
    } else if (typeof value !== "string") {
        throw new WebinyError(
            "Field value must be a string because field is defined as time.",
            "TIME_PARSE_ERROR",
            {
                value
            }
        );
    }
    /**
     * This is for the time format, eg. 12:36:25 or 12:36:25.881
     */
    const [time, milliseconds = 0] = value.split(".");
    const values = time.split(":").map(Number);
    if (values.length < 2) {
        throw new WebinyError("Time must contain at least hours and minutes.", "TIME_PARSE_ERROR", {
            value
        });
    }
    const [hours, minutes, seconds = 0] = values;
    return (hours * 60 * 60 + minutes * 60 + seconds) * 1000 + Number(milliseconds);
};

export class TimeTransformPlugin extends ValueTransformPlugin {
    public constructor(params: Omit<ValueTransformPluginParams, "transform">) {
        super({
            transform: transformTime,
            ...params
        });
    }
}
