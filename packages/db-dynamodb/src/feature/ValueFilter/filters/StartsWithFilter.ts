import { ValueFilter } from "../abstractions/ValueFilter.js";

class StartsWithFilterImpl implements ValueFilter.Interface {
    private readonly operation = "startsWith";

    public canUse({ operation, compareValue }: ValueFilter.CanUseParams): boolean {
        if (this.operation !== operation) {
            return false;
        } else if (compareValue === "" || compareValue === null || compareValue === undefined) {
            return false;
        }
        return true;
    }

    public matches({ value, compareValue }: ValueFilter.MatchesParams): ValueFilter.Result {
        /**
         * We do "case-insensitive" comparison.
         */
        const compareValueInLowerCase = compareValue.toLowerCase();

        if (typeof value !== "string") {
            if (Array.isArray(value) === true) {
                return value.some((v: string) => {
                    return v.toLowerCase().startsWith(compareValueInLowerCase);
                });
            }
            return false;
        }

        return value.toLowerCase().startsWith(compareValueInLowerCase);
    }
}

export const StartsWithFilter = ValueFilter.createImplementation({
    implementation: StartsWithFilterImpl,
    dependencies: []
});
