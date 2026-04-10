import { ValueFilter } from "../abstractions/ValueFilter.js";

class GteFilterImpl implements ValueFilter.Interface {
    private readonly operation = "gte";

    public canUse({ operation }: ValueFilter.CanUseParams): boolean {
        return this.operation === operation;
    }

    public matches({ value, compareValue }: ValueFilter.MatchesParams): ValueFilter.Result {
        return value >= compareValue;
    }
}

export const GteFilter = ValueFilter.createImplementation({
    implementation: GteFilterImpl,
    dependencies: []
});
