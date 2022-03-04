import {
    ValueTransformPlugin,
    ValueTransformPluginParams,
    ValueTransformPluginParamsTransformParams
} from "./ValueTransformPlugin";
import WebinyError from "@webiny/error";
import isNumber from "is-number";

const transformTime = (params: ValueTransformPluginParamsTransformParams): number => {
    const { value } = params;
    const typeOf = typeof value;
    /**
     * Due to some internal JS stuff, we must check for a number like this.
     */
    if (typeOf === "number" || isNumber(value) === true) {
        return Number(value);
    } else if (typeOf !== "string") {
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
    const [time, milliseconds = 0] = (value as any).split(".");
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
