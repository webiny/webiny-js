import Fuse from "fuse.js";
import {
    ValueFilterPluginParamsMatchesParams,
    ValueFilterPlugin
} from "../definitions/ValueFilterPlugin";

export default new ValueFilterPlugin({
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
