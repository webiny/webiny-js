import { ValueFilterPlugin } from "~/plugins/ValueFilterPlugin";

export default new ValueFilterPlugin({
    operation: "contains",
    matches: ({ value, compareValue }) => {
        const re = new RegExp(compareValue, "i");
        return value.match(re) !== null;
    }
});
