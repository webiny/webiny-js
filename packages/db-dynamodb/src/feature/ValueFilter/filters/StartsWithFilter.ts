import { ValueFilter } from "../abstractions/ValueFilter.js";

class StartsWithFilterImpl implements ValueFilter.Interface {
    public readonly operation = "startsWith";

    public is(operation: string): boolean {
        return this.operation === operation;
    }

    public canUse({ compareValue }: ValueFilter.CanUseParams): boolean {
        if (compareValue === "" || compareValue === null || compareValue === undefined) {
            return false;
        }
        return true;
    }

    public matches({ value, compareValue }: ValueFilter.MatchesParams): ValueFilter.Result {
        /**
         * Match null/undefined values.
         */
        if (
            (value === null && compareValue === null) ||
            (value === undefined && compareValue === undefined)
        ) {
            return true;
        }
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
