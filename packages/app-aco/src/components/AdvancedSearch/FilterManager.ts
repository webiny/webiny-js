import { makeAutoObservable } from "mobx";

interface Filter {
    id: string;
    field?: string;
    condition?: string;
    value?: string;
    operation?: "AND" | "OR";
}

export class FilterManager {
    private _filters: Map<string, Filter> = new Map();

    constructor(initialFilters?: Filter[]) {
        makeAutoObservable(this);
        if (initialFilters) {
            for (const filter of initialFilters) {
                this._filters.set(filter.id, filter);
            }
        }
    }

    addFilter(filter: Filter) {
        this._filters.set(filter.id, filter);
    }

    updateFilter(updatedFilter: Filter) {
        if (this._filters.has(updatedFilter.id)) {
            this._filters.set(updatedFilter.id, updatedFilter);
        } else {
            console.error(`Filter with ID '${updatedFilter.id}' does not exist.`);
        }
    }

    removeFilter(filterId: string) {
        if (this._filters.has(filterId)) {
            this._filters.delete(filterId);
        } else {
            console.error(`Filter with ID '${filterId}' does not exist.`);
        }
    }

    getFilters() {
        console.log("demo", Array.from(this._filters.values()));
        return Array.from(this._filters.values());
    }

    removeAllFilters() {
        this._filters.clear();
    }
}
