import Fuse from "fuse.js";
import {
    ValueFilterPluginParamsMatchesParams,
    ValueFilterPlugin
} from "../definitions/ValueFilterPlugin";

/**
 * We will cache the Fuse. If value is already in the cache, use that. Otherwise create a new one...
 */
const cache: Record<string, Fuse<string>> = {};
const createFuse = (value: string) => {
    if (cache[value]) {
        return cache[value];
    }
    cache[value] = new Fuse([value], {});

    return cache[value];
};

export default new ValueFilterPlugin({
    operation: "fuzzy",
    matches: ({
        value,
        compareValue
    }: ValueFilterPluginParamsMatchesParams<string | null, string>) => {
        if (typeof value !== "string") {
            return false;
        }

        const f = createFuse(value);
        const result = f.search(compareValue);

        return result.length > 0;
    }
});
