import { WebinyError } from "@webiny/error";
import { ValueFilter } from "../abstractions/ValueFilter.js";

class AndInFilterImpl implements ValueFilter.Interface {
    private readonly operation = "and_in";

    public canUse({ operation }: ValueFilter.CanUseParams): boolean {
        return this.operation === operation;
    }

    public matches({ value, compareValue }: ValueFilter.MatchesParams): ValueFilter.Result {
        if (!compareValue || Array.isArray(compareValue) === false) {
            throw new WebinyError(
                `The value given as "compareValue" must be an array!`,
                "COMPARE_VALUE_ERROR",
                {
                    value,
                    compareValue
                }
            );
        }
        if (Array.isArray(value) === true) {
            return compareValue.every((c: any) => value.includes(c));
        }
        return compareValue.includes(value);
    }
}

export const AndInFilter = ValueFilter.createImplementation({
    implementation: AndInFilterImpl,
    dependencies: []
});
