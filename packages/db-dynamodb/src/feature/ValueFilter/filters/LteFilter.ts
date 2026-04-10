import { ValueFilter } from "../abstractions/ValueFilter.js";

class LteFilterImpl implements ValueFilter.Interface {
    public readonly operation = "lte";

    public is(operation: string): boolean {
        return this.operation === operation;
    }

    public canUse(): boolean {
        return true;
    }

    public matches({ value, compareValue }: ValueFilter.MatchesParams): ValueFilter.Result {
        return value <= compareValue;
    }
}

export const LteFilter = ValueFilter.createImplementation({
    implementation: LteFilterImpl,
    dependencies: []
});
