import { ValueFilter } from "../abstractions/ValueFilter.js";

class EqFilterImpl implements ValueFilter.Interface {
    private readonly operation = "eq";

    public canUse({ operation }: ValueFilter.CanUseParams): boolean {
        return this.operation === operation;
    }

    public matches({ value, compareValue }: ValueFilter.MatchesParams): ValueFilter.Result {
        /**
         * Possibility that either input value or one from the system is array.
         */
        if (Array.isArray(value) === true) {
            return value.some((v: string) => {
                return Array.isArray(compareValue) ? compareValue.includes(v) : compareValue === v;
            });
        } else if (Array.isArray(compareValue) === true) {
            return compareValue.every((v: string) => {
                return value == v;
            });
        }
        return value == compareValue;
    }
}

export const EqFilter = ValueFilter.createImplementation({
    implementation: EqFilterImpl,
    dependencies: []
});
