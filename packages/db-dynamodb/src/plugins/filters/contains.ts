import { ValueFilterPlugin } from "../definitions/ValueFilterPlugin";

const plugin = new ValueFilterPlugin({
    operation: "contains",
    matches: ({ value: initialValue, compareValue: initialCompareValue }) => {
        const isValueArray = Array.isArray(initialValue);
        if (!initialValue || (isValueArray && initialValue.length === 0)) {
            return false;
        } else if (initialCompareValue === undefined || initialCompareValue === null) {
            return true;
        }
        const values: string[] = isValueArray ? initialValue : [initialValue];
        const compareValues: string[] = initialCompareValue.split(" ");

        return values.some(target => {
            return compareValues.every(compareValue => {
                return target.match(new RegExp(compareValue, "gi")) !== null;
            });
        });
    }
});

plugin.name = "dynamodb.value.filter.contains";

export default plugin;
