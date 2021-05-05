import { CmsFieldValueFilterPlugin } from "../types";
import WebinyError from "@webiny/error";

export default (): CmsFieldValueFilterPlugin<
    string | Date | number,
    (string | Date | number)[] | Date | number
> => ({
    type: "cms-field-value-filter",
    name: "cms-field-value-filter-not-between",
    operation: "not_between",
    matches: ({ inputValue, compareValue }) => {
        if (Array.isArray(compareValue)) {
            if (compareValue.length !== 2) {
                throw new WebinyError(
                    "When comparing between and you give an array, there must be two items in it.",
                    "FILTER_ERROR",
                    {
                        input: inputValue,
                        compareValue
                    }
                );
            }
            const [from, to] = compareValue;
            return inputValue < from && inputValue > to;
        }
        return inputValue < compareValue && inputValue > compareValue;
    }
});
