import Fuse from "fuse.js";
import {
    ValueFilterPlugin,
    ValueFilterPluginParamsMatchesParams
} from "../definitions/ValueFilterPlugin";

const plugin = new ValueFilterPlugin({
    operation: "fuzzy",
    matches: ({
        value: initialValue,
        compareValue: initialCompareValue
    }: ValueFilterPluginParamsMatchesParams<
        string | null | undefined,
        string | null | undefined
    >) => {
        if (typeof initialValue !== "string" || typeof initialCompareValue !== "string") {
            return false;
        }
        const value = initialValue.replaceAll("/", " ");
        const compareValue = initialCompareValue.replaceAll("/", " ");

        const f = new Fuse([value], {
            includeScore: true,
            minMatchCharLength: 3,
            threshold: 0.5,
            isCaseSensitive: false,
            findAllMatches: true,
            ignoreLocation: true
        });
        const result = f.search(compareValue);

        return result.length > 0;
    }
});

plugin.name = "dynamodb.value.filter.fuzzy";

export default plugin;
