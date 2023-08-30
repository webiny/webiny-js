import { Filter, FilterManager, FilterOperation } from "~/components/AdvancedSearch/FilterManager";

describe("FilterManager", () => {
    let filterManager: FilterManager;

    beforeEach(() => {
        filterManager = new FilterManager();
    });

    it("should set and get filters", () => {
        const filter: Filter = {
            id: "anyid",
            field: "name",
            value: "Bob",
            condition: "contains"
        };

        filterManager.addFilter();
        const filters = filterManager.getFilters();
        expect(filters.length).toEqual([filter]);
    });

    it("should update filter", () => {
        const filters: Filter[] = [
            {
                id: "id-1",
                field: "firstName",
                value: "John",
                condition: "contains",
                operation: FilterOperation.AND
            },
            {
                id: "id-2",
                field: "age",
                value: 23,
                condition: "contains",
                operation: FilterOperation.AND
            },
            {
                id: "id-3",
                field: "lastName",
                value: "Doe",
                condition: "contains"
            }
        ];

        for (const filter of filters) {
            filterManager.addFilter(filter);
        }

        filterManager.updateFilter({
            id: "id-2",
            field: "age",
            value: 24,
            condition: "contains",
            operation: FilterOperation.AND
        });

        const updatedFilters = filterManager.getFilters();
        expect(updatedFilters).toEqual([
            {
                id: "id-1",
                field: "firstName",
                value: "John",
                condition: "contains",
                operation: FilterOperation.AND
            },
            {
                id: "id-2",
                field: "age",
                value: 24,
                condition: "contains",
                operation: FilterOperation.AND
            },
            {
                id: "id-3",
                field: "lastName",
                value: "Doe",
                condition: "contains"
            }
        ]);
    });

    it("should delete filter by id", () => {
        const filters: Filter[] = [
            {
                id: "id-1",
                field: "firstName",
                value: "John",
                condition: "contains",
                operation: FilterOperation.AND
            },
            {
                id: "id-2",
                field: "age",
                value: 23,
                condition: "contains",
                operation: FilterOperation.AND
            },
            {
                id: "id-3",
                field: "lastName",
                value: "Doe",
                condition: "contains"
            }
        ];

        for (const filter of filters) {
            filterManager.addFilter(filter);
        }

        filterManager.removeFilter("id-2");

        const updatedFilters = filterManager.getFilters();
        expect(updatedFilters).toEqual([
            {
                id: "id-1",
                field: "firstName",
                value: "John",
                condition: "contains",
                operation: FilterOperation.AND
            },
            {
                id: "id-3",
                field: "lastName",
                value: "Doe",
                condition: "contains"
            }
        ]);
    });

    it("should delete all filters", () => {
        const filters: Filter[] = [
            {
                id: "id-1",
                field: "firstName",
                value: "John",
                condition: "contains",
                operation: FilterOperation.AND
            },
            {
                id: "id-2",
                field: "age",
                value: 23,
                condition: "contains",
                operation: FilterOperation.AND
            },
            {
                id: "id-3",
                field: "lastName",
                value: "Doe",
                condition: "contains"
            }
        ];

        for (const filter of filters) {
            filterManager.addFilter(filter);
        }

        filterManager.removeAllFilters();

        const deletedFilters = filterManager.getFilters();
        expect(deletedFilters).toEqual([]);
    });
});
