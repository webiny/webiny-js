import WebinyError from "@webiny/error";
import { ValueFilterPlugin } from "~/plugins/ValueFilterPlugin";

export default new ValueFilterPlugin({
    operation: "between",
    matches: ({ value, compareValue }) => {
        if (Array.isArray(compareValue)) {
            if (compareValue.length !== 2) {
                throw new WebinyError(
                    "When comparing between and you give an array, there must be two items in it.",
                    "FILTER_ERROR",
                    {
                        value,
                        compareValue
                    }
                );
            }
            const [from, to] = compareValue;
            return value >= from && value <= to;
        }
        return value >= compareValue && value <= compareValue;
    }
});
