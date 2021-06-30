import { ValueFilterPlugin } from "~/plugins/ValueFilterPlugin";

export default new ValueFilterPlugin({
    operation: "lt",
    matches: ({ value, compareValue }) => {
        return value < compareValue;
    }
});
