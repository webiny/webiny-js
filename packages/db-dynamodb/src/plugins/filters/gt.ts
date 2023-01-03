import { ValueFilterPlugin } from "../definitions/ValueFilterPlugin";

const plugin = new ValueFilterPlugin({
    operation: "gt",
    matches: ({ value, compareValue }) => {
        return value > compareValue;
    }
});

plugin.name = "dynamodb.value.filter.gt";

export default plugin;
