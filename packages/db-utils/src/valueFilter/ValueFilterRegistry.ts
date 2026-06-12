import { ValueFilterRegistry as Abstraction } from "./abstractions/ValueFilterRegistry.js";
import { ValueFilter } from "./abstractions/ValueFilter.js";

class ValueFilterRegistryImpl implements Abstraction.Interface {
    public constructor(private readonly filters: ValueFilter.Interface[]) {}

    public get(operation: string): ValueFilter.Interface | undefined {
        return this.filters.find(filter => {
            return filter.is(operation);
        });
    }

    public getAll(): ValueFilter.Interface[] {
        return this.filters;
    }
}

export const ValueFilterRegistry = Abstraction.createImplementation({
    implementation: ValueFilterRegistryImpl,
    dependencies: [[ValueFilter, { multiple: true }]]
});
