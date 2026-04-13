import { ValueFilter } from "../abstractions/ValueFilter.js";

class LtFilterImpl implements ValueFilter.Interface {
    public readonly operation = "lt";

    public is(operation: string): boolean {
        return this.operation === operation;
    }

    public canUse(): boolean {
        return true;
    }

    public matches({ value, compareValue }: ValueFilter.MatchesParams): ValueFilter.Result {
        return value < compareValue;
    }
}

export const LtFilter = ValueFilter.createImplementation({
    implementation: LtFilterImpl,
    dependencies: []
});
