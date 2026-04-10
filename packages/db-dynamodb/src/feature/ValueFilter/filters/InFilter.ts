import { WebinyError } from "@webiny/error";
import { ValueFilter } from "../abstractions/ValueFilter.js";

class InFilterImpl implements ValueFilter.Interface {
    private readonly operation = "in";

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
            return compareValue.some((c: any) => value.includes(c));
        }
        return compareValue.includes(value);
    }
}

export const InFilter = ValueFilter.createImplementation({
    implementation: InFilterImpl,
    dependencies: []
});
