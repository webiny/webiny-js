import Fuse from "fuse.js";
import { ValueFilter } from "../abstractions/ValueFilter.js";

class FuzzyFilterImpl implements ValueFilter.Interface<string | null | undefined> {
    private readonly operation = "fuzzy";

    public canUse({ operation }: ValueFilter.CanUseParams): boolean {
        return this.operation === operation;
    }

    public matches({
        value: initialValue,
        compareValue: initialCompareValue
    }: ValueFilter.MatchesParams): ValueFilter.Result {
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
}

export const FuzzyFilter = ValueFilter.createImplementation({
    implementation: FuzzyFilterImpl,
    dependencies: []
});
