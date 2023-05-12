import { ValueFilterPlugin } from "../definitions/ValueFilterPlugin";

const plugin = new ValueFilterPlugin({
    operation: "gte",
    matches: ({ value, compareValue }) => {
        return value >= compareValue;
    }
});

plugin.name = "dynamodb.value.filter.gte";

export default plugin;
