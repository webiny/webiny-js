import WebinyError from "@webiny/error";
import { KeyParserResult } from "../types";

/**
 * A simple function that splits the given key with underscore (_) separator and extracts attribute and operation.
 * Function does not check the existence of operations or attributes, just returns them.
 */
export const keyParser = (key: string): KeyParserResult => {
    const values = key.split("_");
    /**
     * In the case values contains a single item, we treat the key as attr and use default "eq" operation.
     */
    if (values.length === 1) {
        return {
            attr: key,
            operation: "eq"
        };
    } else if (values.length > 3) {
        /**
         * In case of having more than 3 items in the values, we decide that it is an error on the input.
         */
        throw new WebinyError("Wrong format of the filter key", "FILTER_KEY_ERROR", {
            key
        });
    }
    const [attr, ...operation] = values;
    /**
     * In the case we have two values in the operation, we need to check that first one is a NOT keyword.
     * There should be no operations that contain underscore in them.
     */
    if (operation.length === 2 && operation[0] !== "not") {
        throw new WebinyError("Unsupported keyword on the filter key.", "FILTER_KEY_ERROR", {
            key,
            keyword: operation[0],
            values: operation
        });
    }
    return {
        attr,
        operation: operation.join("_")
    };
};
