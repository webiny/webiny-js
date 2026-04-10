import { ValueFilter } from "../abstractions/ValueFilter.js";

class LteFilterImpl implements ValueFilter.Interface {
    private readonly operation = "lte";

    public canUse({ operation }: ValueFilter.CanUseParams): boolean {
        return this.operation === operation;
    }

    public matches({ value, compareValue }: ValueFilter.MatchesParams): ValueFilter.Result {
        return value <= compareValue;
    }
}

export const LteFilter = ValueFilter.createImplementation({
    implementation: LteFilterImpl,
    dependencies: []
});
