import { ValueFilterPlugin } from "../definitions/ValueFilterPlugin";

const plugin = new ValueFilterPlugin({
    operation: "eq",
    matches: ({ value, compareValue }) => {
        /**
         * Possibility that either input value or one from the system is array.
         */
        if (Array.isArray(value) === true) {
            return value.some((v: string) => {
                return Array.isArray(compareValue) ? compareValue.includes(v) : compareValue === v;
            });
        } else if (Array.isArray(compareValue) === true) {
            return compareValue.every((v: string) => {
                return value == v;
            });
        }
        return value == compareValue;
    }
});

plugin.name = "dynamodb.value.filter.eq";

export default plugin;
