import { ValueFilterPlugin } from "../definitions/ValueFilterPlugin";

const plugin = new ValueFilterPlugin({
    operation: "lte",
    matches: ({ value, compareValue }) => {
        return value <= compareValue;
    }
});

plugin.name = "dynamodb.value.filter.lte";

export default plugin;
