import { Condition } from "../types";
import WebinyError from "@webiny/error";

const types = ["string", "number"];
const condition: Condition = {
    key: "contains",
    validate: ({ value, attr }) => {
        const type = typeof value;
        if (types.includes(type) === false) {
            throw new WebinyError(
                "CONTAINS condition value is of non-supported type.",
                "CONTAINS_ERROR",
                {
                    type,
                    value,
                    attr
                }
            );
        }
    }
};

export default condition;
