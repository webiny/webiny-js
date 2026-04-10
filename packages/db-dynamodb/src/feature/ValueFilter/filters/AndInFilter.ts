import { WebinyError } from "@webiny/error";
import { ValueFilter } from "../abstractions/ValueFilter.js";

class AndInFilterImpl implements ValueFilter.Interface {
    public readonly operation = "and_in";

    public is(operation: string): boolean {
        return this.operation === operation;
    }

    public canUse(): boolean {
        return true;
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
