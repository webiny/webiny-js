import { ValueFilterPlugin } from "../definitions/ValueFilterPlugin";
import WebinyError from "@webiny/error";

interface MatchesParams {
    value: any[];
    compareValue?: any[];
}

export default new ValueFilterPlugin({
    operation: "and_in",
    matches: ({ value, compareValue }: MatchesParams) => {
        if (!compareValue || Array.isArray(compareValue) === false) {
            throw new WebinyError(
                `The value given as "compareValue" must be an array!`,
                "COMPARE_VALUE_ERROR",
                {
                    value,
                    compareValue
                }
            );
        }
        if (Array.isArray(value) === true) {
            return compareValue.every(c => value.includes(c));
        }
        return compareValue.includes(value);
    }
});
