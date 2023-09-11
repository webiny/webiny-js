import { makeAutoObservable } from "mobx";

import { Filter, ISearchConfigurationRepository } from "./SearchConfiguration";
import { FilterOperation } from "~/components/AdvancedSearch/types";

export class SearchConfigurationPresenter {
    private readonly searchConfiguration: ISearchConfigurationRepository;

    constructor(repository: ISearchConfigurationRepository) {
        this.searchConfiguration = repository;
        makeAutoObservable(this);
    }

    get viewModel() {
        return {
            operations: this.searchConfiguration.getOperations(),
            operation: this.searchConfiguration.getOperation(),
            toGraphql: () => this.searchConfiguration.toGraphql(),
            groups: this.searchConfiguration.getGroups().map(group => ({
                id: group.id,
                operation: group.operation,
                setOperation: (operation: FilterOperation) => group.setOperation(operation),
                addFilter: () => group.addFilter(),
                deleteFilter: (filter: Filter) => group.deleteFilter(filter),
                updateFilter: (filter: Filter) => group.updateFilter(filter),
                filters: group.filters.map(filter => ({
                    id: filter.id,
                    field: filter.field,
                    value: filter.value,
                    condition: filter.condition
                }))
            }))
        };
    }
}
