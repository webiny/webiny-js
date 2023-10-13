import { ValueFilterPlugin } from "../definitions/ValueFilterPlugin";

const plugin = new ValueFilterPlugin({
    operation: "startsWith",
    canUse: ({ compareValue }) => {
        if (compareValue === "" || compareValue === null || compareValue === undefined) {
            return false;
        }
        return true;
    },
    matches: ({ value, compareValue }) => {
        /**
         * We do "case-insensitive" comparison.
         */
        const compareValueInLowerCase = compareValue.toLowerCase();

        if (typeof value !== "string") {
            if (Array.isArray(value) === true) {
                return value.some((v: string) => {
                    return v.toLowerCase().startsWith(compareValueInLowerCase);
                });
            }
            return false;
        }

        return value.toLowerCase().startsWith(compareValueInLowerCase);
    }
});

plugin.name = "dynamodb.value.filter.startsWith";

export default plugin;
