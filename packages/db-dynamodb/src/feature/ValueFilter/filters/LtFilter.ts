import { ValueFilter } from "../abstractions/ValueFilter.js";

class LtFilterImpl implements ValueFilter.Interface {
    public readonly operation = "lt";

    public canUse({ operation }: ValueFilter.CanUseParams): boolean {
        return this.operation === operation;
    }

    public matches({ value, compareValue }: ValueFilter.MatchesParams): ValueFilter.Result {
        return value < compareValue;
    }
}

export const LtFilter = ValueFilter.createImplementation({
    implementation: LtFilterImpl,
    dependencies: []
});
