import { Condition } from "../types";
import WebinyError from "@webiny/error";

const condition: Condition = {
    key: "in",
    validate: ({ value, attr }) => {
        if (!Array.isArray(value)) {
            throw new WebinyError("IN condition value is not an array.", "IN_CONDITION_ERROR", {
                value,
                attr
            });
        } else if (value.length === 0) {
            throw new WebinyError("IN condition value is empty array.", "IN_CONDITION_ERROR", {
                attr
            });
        }
        const filtered = value.filter(v => v !== undefined && v !== null);
        if (filtered.length === 0) {
            throw new WebinyError(
                "IN condition value is empty array after the undefined and null tests.",
                "IN_CONDITION_ERROR",
                {
                    value,
                    attr
                }
            );
        }
    }
};

export default condition;
