import { Condition } from "../types";
import WebinyError from "@webiny/error";

const types = ["number"];

const condition: Condition = {
    key: "lte",
    /**
     * Validation allows number and Date values.
     */
    validate: ({ value, attr }) => {
        const isDate = value instanceof Date || (value && !!value.toISOString);
        const type = typeof value;
        if (types.includes(type) === false && !isDate) {
            throw new WebinyError("LTE condition value is of non-supported type.", "LTE_ERROR", {
                type,
                value,
                attr,
                isDate
            });
        }
    }
};

export default condition;
