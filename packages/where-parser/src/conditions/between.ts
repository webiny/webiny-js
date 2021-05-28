import { Condition } from "../types";
import WebinyError from "@webiny/error";

const condition: Condition = {
    key: "between",
    /**
     * Validation allows only array with two values.
     * Values are not validated.
     */
    validate: ({ value, attr }) => {
        if (Array.isArray(value) === false) {
            throw new WebinyError("BETWEEN condition value is not an array.", "BETWEEN_ERROR", {
                value,
                attr
            });
        } else if (value.length !== 2) {
            throw new WebinyError(
                "BETWEEN condition value must contain two items in the array.",
                "BETWEEN_ERROR",
                {
                    value,
                    attr
                }
            );
        }
    }
};

export default condition;
