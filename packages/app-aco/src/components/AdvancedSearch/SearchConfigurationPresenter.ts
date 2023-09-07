import { SearchConfiguration } from "~/components/AdvancedSearch/SearchConfiguration";
import { makeAutoObservable } from "mobx";

export class SearchConfigurationPresenter {
    private readonly searchConfiguration: SearchConfiguration;

    constructor(repository: ISearchConfigurationRepository) {
        this.searchConfiguration = new SearchConfiguration();
        makeAutoObservable(this);
    }

    get viewModel() {
        console.log("generate viewModel");
        return {
            addGroup: () => this.searchConfiguration.addGroup(),
            groups: this.searchConfiguration.getGroups().map(group => ({
                addFilter: () => group.addFilter(),
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

interface ISearchConfigurationRepository {
    addGroup(): void;
}

class CurrentSearchConfigurationRepository {
    addGroup() {}
}
export const currentSearchConfigurationRepository = new CurrentSearchConfigurationRepository();
