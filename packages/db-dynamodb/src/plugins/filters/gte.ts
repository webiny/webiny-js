import { ValueFilterPlugin } from "../definitions/ValueFilterPlugin";

export default new ValueFilterPlugin({
    operation: "gte",
    matches: ({ value, compareValue }) => {
        return value >= compareValue;
    }
});
