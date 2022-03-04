import {
    ValueTransformPlugin,
    ValueTransformPluginParams,
    ValueTransformPluginParamsTransformParams
} from "./ValueTransformPlugin";
import WebinyError from "@webiny/error";
import isNumber from "is-number";

const transformNumber = (params: ValueTransformPluginParamsTransformParams): number => {
    const { value } = params;
    const typeOf = typeof value;
    /**
     * Due to some internal JS stuff, we must check for a number like this.
     */
    if (typeOf === "number" || isNumber(value) === true) {
        return Number(value);
    }
    throw new WebinyError("Field value must be a number because.", "NUMBER_ERROR", {
        value
    });
};

export class NumberTransformPlugin extends ValueTransformPlugin {
    public constructor(params: Omit<ValueTransformPluginParams, "transform">) {
        super({
            transform: transformNumber,
            ...params
        });
    }
}
