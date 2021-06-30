import { ValueFilterPlugin } from "~/plugins/ValueFilterPlugin";

export default new ValueFilterPlugin({
    operation: "in",
    matches: ({ value, compareValue }) => {
        return compareValue.includes(value);
    }
});
