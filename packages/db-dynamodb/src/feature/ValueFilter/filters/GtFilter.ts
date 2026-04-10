import { ValueFilter } from "../abstractions/ValueFilter.js";

class GtFilterImpl implements ValueFilter.Interface {
    private readonly operation = "gt";

    public canUse({ operation }: ValueFilter.CanUseParams): boolean {
        return this.operation === operation;
    }

    public matches({ value, compareValue }: ValueFilter.MatchesParams): ValueFilter.Result {
        return value > compareValue;
    }
}

export const GtFilter = ValueFilter.createImplementation({
    implementation: GtFilterImpl,
    dependencies: []
});
