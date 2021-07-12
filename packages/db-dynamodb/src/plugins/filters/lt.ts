import { ValueFilterPlugin } from "../definitions/ValueFilterPlugin";

export default new ValueFilterPlugin({
    operation: "lt",
    matches: ({ value, compareValue }) => {
        return value < compareValue;
    }
});
