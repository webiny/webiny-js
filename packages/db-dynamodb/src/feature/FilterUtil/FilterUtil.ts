import { FilterUtil as Abstraction } from "./abstractions/FilterUtil.js";
import { ValueFilterRegistry } from "~/feature/ValueFilter/index.js";
import { createFilterCallable } from "./createFilters.js";

class FilterUtilImpl implements Abstraction.Interface {
    public constructor(private readonly filterRegistry: ValueFilterRegistry.Interface) {}

    public filter<T = any>(params: Abstraction.Params<T>): T[] {
        const filterFn = createFilterCallable({
            filterRegistry: this.filterRegistry,
            where: params.where,
            fields: params.fields
        });
        /**
         * No point in going through all the items when there are no filters to be applied.
         */
        if (!filterFn) {
            return params.items;
        }
        return params.items.filter(filterFn);
    }
}

export const FilterUtil = Abstraction.createImplementation({
    implementation: FilterUtilImpl,
    dependencies: [ValueFilterRegistry]
});
