import { ValueFilterPlugin } from "../definitions/ValueFilterPlugin";
import WebinyError from "@webiny/error";

interface MatchesParams {
    value: any[];
    compareValue?: any[];
}

const plugin = new ValueFilterPlugin({
    operation: "in",
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
            return compareValue.some(c => value.includes(c));
        }
        return compareValue.includes(value);
    }
});

plugin.name = "dynamodb.value.filter.in";

export default plugin;
