import { WebinyError } from "@webiny/error";
import { ValueFilter } from "../abstractions/ValueFilter.js";

class BetweenFilterImpl implements ValueFilter.Interface {
    private readonly operation = "between";

    public canUse({ operation }: ValueFilter.CanUseParams): boolean {
        return this.operation === operation;
    }

    public matches({ value, compareValue }: ValueFilter.MatchesParams): ValueFilter.Result {
        if (Array.isArray(compareValue)) {
            if (compareValue.length !== 2) {
                throw new WebinyError(
                    "When comparing between and you give an array, there must be two items in it.",
                    "FILTER_ERROR",
                    {
                        value,
                        compareValue
                    }
                );
            }
            const [from, to] = compareValue;
            return value >= from && value <= to;
        }
        return value >= compareValue && value <= compareValue;
    }
}

export const BetweenFilter = ValueFilter.createImplementation({
    implementation: BetweenFilterImpl,
    dependencies: []
});
