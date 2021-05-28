import { Condition } from "../types";
import WebinyError from "@webiny/error";

const types = ["number"];

const condition: Condition = {
    key: "gte",
    /**
     * Validation allows number and Date values.
     */
    validate: ({ value, attr }) => {
        const isDate = value instanceof Date || (value && !!value.toISOString);
        const type = typeof value;
        if (types.includes(type) === false && !isDate) {
            throw new WebinyError("GTE condition value is of non-supported type.", "GTE_ERROR", {
                type,
                value,
                attr,
                isDate
            });
        }
    }
};

export default condition;
