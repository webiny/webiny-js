import { ValueFilterPlugin } from "../definitions/ValueFilterPlugin";

const plugin = new ValueFilterPlugin({
    operation: "contains",
    matches: ({ value, compareValue }) => {
        if (typeof value !== "string") {
            if (Array.isArray(value) === true) {
                const re = new RegExp(compareValue, "i");
                return value.some((v: string) => {
                    return v.match(re) !== null;
                });
            }
            return false;
        }
        const re = new RegExp(compareValue, "i");
        return value.match(re) !== null;
    }
});

plugin.name = "dynamodb.value.filter.contains";

export default plugin;
