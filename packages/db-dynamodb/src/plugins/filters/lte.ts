import { ValueFilterPlugin } from "~/plugins/ValueFilterPlugin";

export default new ValueFilterPlugin({
    operation: "lte",
    matches: ({ value, compareValue }) => {
        return value <= compareValue;
    }
});
