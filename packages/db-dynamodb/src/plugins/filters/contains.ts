import { ValueFilterPlugin } from "../definitions/ValueFilterPlugin";

export default new ValueFilterPlugin({
    operation: "contains",
    matches: ({ value, compareValue }) => {
        if (typeof value !== "string") {
            return false;
        }
        const re = new RegExp(compareValue, "i");
        return value.match(re) !== null;
    }
});
