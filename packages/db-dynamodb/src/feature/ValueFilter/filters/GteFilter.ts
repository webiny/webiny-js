import { ValueFilter } from "../abstractions/ValueFilter.js";

class GteFilterImpl implements ValueFilter.Interface {
    public readonly operation = "gte";

    public is(operation: string): boolean {
        return this.operation === operation;
    }

    public canUse(): boolean {
        return true;
    }

    public matches({ value, compareValue }: ValueFilter.MatchesParams): ValueFilter.Result {
        return value >= compareValue;
    }
}

export const GteFilter = ValueFilter.createImplementation({
    implementation: GteFilterImpl,
    dependencies: []
});
