import { ValueFilterPlugin } from "../definitions/ValueFilterPlugin";

export default new ValueFilterPlugin({
    operation: "contains",
    matches: ({ value, compareValue }) => {
        if (typeof value !== "string") {
            if (Array.isArray(value) === true) {
                const re = new RegExp(compareValue, "i");
                return value.some(v => {
                    return v.match(re) !== null;
                });
            }
            return false;
        }
        const re = new RegExp(compareValue, "i");
        return value.match(re) !== null;
    }
});
