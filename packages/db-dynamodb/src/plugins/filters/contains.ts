import { ValueFilterPlugin } from "../definitions/ValueFilterPlugin";

const createValues = (initialValue: string | string[]) => {
    return Array.isArray(initialValue) ? initialValue : [initialValue];
};

const createCompareValues = (value: string) => {
    return value
        .replace(/\s+/g, " ")
        .trim()
        .replace(/\?/g, `\\?`)
        .replace(/\//g, `\\/`)
        .replace(/:/g, ``)
        .replace(/\-/g, `\\-`)
        .split(" ")
        .filter(val => {
            return val.length > 0;
        });
};

const plugin = new ValueFilterPlugin({
    operation: "contains",
    matches: ({ value: initialValue, compareValue: initialCompareValue }) => {
        if (!initialValue || (Array.isArray(initialValue) && initialValue.length === 0)) {
            return false;
        } else if (initialCompareValue === undefined || initialCompareValue === null) {
            return true;
        }
        const values = createValues(initialValue);
        const compareValues = createCompareValues(initialCompareValue);
        return values.some(target => {
            // return target.match(compareValues) !== null;
            return compareValues.every(compareValue => {
                return target.match(new RegExp(compareValue, "gi")) !== null;
            });
        });
    }
});

plugin.name = "dynamodb.value.filter.contains";

export default plugin;
