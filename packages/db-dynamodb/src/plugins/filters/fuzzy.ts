import Fuse from "fuse.js";
import {
    ValueFilterPluginParamsMatchesParams,
    ValueFilterPlugin
} from "../definitions/ValueFilterPlugin";

const plugin = new ValueFilterPlugin({
    operation: "fuzzy",
    matches: ({
        value,
        compareValue
    }: ValueFilterPluginParamsMatchesParams<string | null, string>) => {
        if (typeof value !== "string") {
            return false;
        }
        const f = new Fuse([value], {});
        const result = f.search(compareValue);

        return result.length > 0;
    }
});

plugin.name = "dynamodb.value.filter.fuzzy";

export default plugin;
