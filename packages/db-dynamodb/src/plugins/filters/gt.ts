import { ValueFilterPlugin } from "../definitions/ValueFilterPlugin";

export default new ValueFilterPlugin({
    operation: "gt",
    matches: ({ value, compareValue }) => {
        return value > compareValue;
    }
});
