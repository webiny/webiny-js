import { Condition } from "../types";
import WebinyError from "@webiny/error";

const types = ["number", "string", "boolean"];

const condition: Condition = {
    key: "eq",
    /**
     * Validation allows number, string, boolean, Date and null values.
     */
    validate: ({ attr, value }) => {
        const isDate = value instanceof Date || (value && !!value.toISOString);
        const type = typeof value;
        if (types.includes(type) === false && !isDate && value !== null) {
            throw new WebinyError("EQ condition value is of non-supported type.", "EQ_ERROR", {
                type,
                value,
                attr,
                isDate
            });
        }
    }
};

export default condition;
