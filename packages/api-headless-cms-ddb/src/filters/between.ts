import { CmsFieldValueFilterPlugin } from "../types";
import WebinyError from "@webiny/error";

export default (): CmsFieldValueFilterPlugin<string, string[] | string> => ({
    type: "cms-field-value-filter",
    name: "cms-field-value-filter-between",
    operation: "between",
    matches: ({ inputValue, compareValue }) => {
        if (Array.isArray(compareValue)) {
            if (compareValue.length !== 2) {
                throw new WebinyError(
                    "When comparing between and you give an array, there must be two items in it.",
                    "FILTER_ERROR",
                    {
                        inputValue,
                        compareValue
                    }
                );
            }
            const [from, to] = compareValue;
            return inputValue >= from && inputValue <= to;
        }
        return inputValue >= compareValue && inputValue <= compareValue;
    }
});
