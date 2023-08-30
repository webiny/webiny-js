import { makeAutoObservable } from "mobx";
import { generateId } from "@webiny/utils";

import { Filter, FilterOperation, FilterValue } from "~/components/AdvancedSearch/types";

/**
 * Manages a collection of filters.
 */
export class FilterManager {
    private _filters: Map<string, Filter> = new Map();

    /**
     * Creates a new FilterManager instance.
     */
    constructor() {
        makeAutoObservable(this);
    }

    /**
     * Retrieves an array of all filters currently managed.
     * @returns An array of Filter objects.
     */
    listFilters(): Filter[] {
        return Array.from(this._filters.values());
    }

    /**
     * Generates a hierarchical representation of filters grouped by operation.
     * @returns An object containing filter groups by operation.
     */
    getFiltersOutput(): Record<FilterOperation, Record<string, FilterValue>[]> {
        return Array.from(this._filters.values()).reduce((result, filter) => {
            const { field, condition, value, operation = FilterOperation.AND } = filter;
            const key = `${field}${condition}`.trim();

            if (!result[operation]) {
                result[operation] = [];
            }

            result[operation].push({ [key]: value });

            return result;
        }, {} as Record<FilterOperation, Record<string, FilterValue>[]>);
    }

    /**
     * Adds a new filter to the manager
     */
    createFilter(): void {
        const id = generateId();
        this._filters.set(id, { id });
    }

    /**
     * Updates an existing filter with new information.
     * @param updatedFilter - The updated filter object.
     * @throws Error if the provided filter ID does not exist.
     */
    updateFilter(updatedFilter: Filter): void {
        if (this._filters.has(updatedFilter.id)) {
            this._filters.set(updatedFilter.id, updatedFilter);
        } else {
            throw new Error(`Filter with ID '${updatedFilter.id}' does not exist.`);
        }
    }

    /**
     * Removes a filter from the manager.
     * @param filterId - The ID of the filter to remove.
     * @throws Error if the provided filter ID does not exist.
     */
    deleteFilter(filterId: string): void {
        if (this._filters.has(filterId)) {
            this._filters.delete(filterId);
        } else {
            throw new Error(`Filter with ID '${filterId}' does not exist.`);
        }
    }

    /**
     * Removes all filters from the manager.
     */
    deleteAllFilters(): void {
        this._filters.clear();
    }
}
