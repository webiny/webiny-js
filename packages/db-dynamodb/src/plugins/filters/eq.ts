import { ValueFilterPlugin } from "../definitions/ValueFilterPlugin";

export default new ValueFilterPlugin({
    operation: "eq",
    matches: ({ value, compareValue }) => {
        /**
         * Possibility that either input value or one from the system is array.
         */
        if (Array.isArray(value) === true) {
            return value.some(v => {
                return Array.isArray(compareValue) ? compareValue.includes(v) : compareValue === v;
            });
        } else if (Array.isArray(compareValue) === true) {
            return compareValue.every(v => {
                return value === v;
            });
        }
        return value === compareValue;
    }
});
