import { ValueFilterPlugin } from "../definitions/ValueFilterPlugin";

const plugin = new ValueFilterPlugin({
    operation: "lt",
    matches: ({ value, compareValue }) => {
        return value < compareValue;
    }
});

plugin.name = "dynamodb.value.filter.lt";

export default plugin;
