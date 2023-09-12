import { makeAutoObservable } from "mobx";

import { ISearchConfigurationRepository } from "./SearchConfiguration";

export class SearchConfigurationPresenter {
    private readonly repository: ISearchConfigurationRepository;

    constructor(repository: ISearchConfigurationRepository) {
        this.repository = repository;
        makeAutoObservable(this);
    }

    get viewModel() {
        const configuration = this.repository.getSearchConfiguration();

        return {
            toObject: () => configuration.toObject(),
            operations: Object.values(configuration.operations),
            configuration: {
                operation: configuration.operation,
                groups: configuration.groups.map(group => ({
                    id: group.id,
                    operation: group.operation,
                    filters: group.filters.map(filter => ({
                        id: filter.id,
                        field: filter.field,
                        value: filter.value,
                        condition: filter.condition
                    }))
                }))
            }
        };
    }
}
