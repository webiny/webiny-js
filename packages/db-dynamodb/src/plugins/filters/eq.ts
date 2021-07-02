import { ValueFilterPlugin } from "~/plugins/ValueFilterPlugin";

export default new ValueFilterPlugin({
    operation: "eq",
    matches: ({ value, compareValue }) => {
        return value === compareValue;
    }
});
