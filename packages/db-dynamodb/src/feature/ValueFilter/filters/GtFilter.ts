import { ValueFilter } from "../abstractions/ValueFilter.js";

class GtFilterImpl implements ValueFilter.Interface {
    public readonly operation = "gt";

    public is(operation: string): boolean {
        return this.operation === operation;
    }

    public canUse(): boolean {
        return true;
    }

    public matches({ value, compareValue }: ValueFilter.MatchesParams): ValueFilter.Result {
        return value > compareValue;
    }
}

export const GtFilter = ValueFilter.createImplementation({
    implementation: GtFilterImpl,
    dependencies: []
});
