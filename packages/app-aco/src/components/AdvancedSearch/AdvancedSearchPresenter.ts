import { makeAutoObservable } from "mobx";
import { generateId } from "@webiny/utils";

import { IFilter, FilterOperation, FilterValue } from "~/components/AdvancedSearch/types";

/**
 * Manages a collection of filters.
 */
class FilterCollection {
    private _filters: Map<string, IFilter> = new Map();

    constructor() {
        makeAutoObservable(this);
    }

    /**
     * Retrieves an array of all filters currently managed.
     * @returns An array of Filter objects.
     */
    public list(): IFilter[] {
        return Array.from(this._filters.values());
    }

    /**
     * Adds a new filter to the collection.
     */
    public create(): void {
        const id = generateId();
        this._filters.set(id, { id });
    }

    /**
     * Updates an existing filter with new information.
     * @param filter - The updated filter object.
     * @throws Error if the provided filter ID does not exist.
     */
    public update(filter: IFilter): void {
        if (this._filters.has(filter.id)) {
            this._filters.set(filter.id, filter);
        } else {
            throw new Error(`Filter with ID '${filter.id}' does not exist.`);
        }
    }

    /**
     * Removes a filter from the collection.
     * @param id - The ID of the filter to remove.
     * @throws Error if the provided filter ID does not exist.
     */
    public delete(id: string): void {
        if (this._filters.has(id)) {
            this._filters.delete(id);
        } else {
            throw new Error(`Filter with ID '${id}' does not exist.`);
        }
    }

    /**
     * Removes all filters from the collection.
     */
    public deleteAll(): void {
        this._filters.clear();
    }
}

/**
 * Manages the Advanced Search Filter
 */
export class AdvancedSearchPresenter {
    private _filterCollection;

    constructor() {
        this._filterCollection = new FilterCollection();
    }

    public listFilters(): IFilter[] {
        return this._filterCollection.list();
    }

    public createFilter(): void {
        this._filterCollection.create();
    }

    public updateFilter(filter: IFilter): void {
        this._filterCollection.update(filter);
    }

    public deleteFilter(id: string): void {
        this._filterCollection.delete(id);
    }

    public deleteAllFilters(): void {
        this._filterCollection.deleteAll();
    }

    /**
     * Generates a hierarchical representation of filters grouped by operation.
     * @returns An object containing filter groups by operation.
     */
    public getFiltersOutput(): Record<FilterOperation, Record<string, FilterValue>[]> {
        return this._filterCollection.list().reduce((result, filter) => {
            const { field, condition, value, operation = FilterOperation.AND } = filter;
            const key = `${field}${condition}`.trim();

            if (!result[operation]) {
                result[operation] = [];
            }

            result[operation].push({ [key]: value });

            return result;
        }, {} as Record<FilterOperation, Record<string, FilterValue>[]>);
    }
}
