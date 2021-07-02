import { ValueFilterPlugin } from "~/plugins/ValueFilterPlugin";

export default new ValueFilterPlugin({
    operation: "gt",
    matches: ({ value, compareValue }) => {
        return value > compareValue;
    }
});
