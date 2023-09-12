import { makeAutoObservable } from "mobx";
import { IBuilderRepository } from "./BuilderRepository";
import { Filter, Group, SearchConfiguration, SearchConfigurationDTO } from "./SearchConfiguration";
import { FilterOperation } from "~/components/AdvancedSearch/types";

export class BuilderController {
    private readonly repository: IBuilderRepository;

    constructor(repository: IBuilderRepository) {
        this.repository = repository;
        makeAutoObservable(this);
    }

    addGroup() {
        const config = this.repository.getSearchConfiguration();
        config.groups.push(new Group(FilterOperation.AND, [new Filter()]));
    }

    deleteGroup(groupIndex: number) {
        const config = this.repository.getSearchConfiguration();
        config.groups = config.groups.filter((_, index) => index !== groupIndex);
    }

    addFilter(groupIndex: number) {
        const config = this.repository.getSearchConfiguration();
        const group = config.groups[groupIndex];
        config.groups[groupIndex] = new Group(group.operation, [...group.filters, new Filter()]);
    }

    deleteFilter(groupIndex: number, filterIndex: number) {
        const config = this.repository.getSearchConfiguration();
        const group = config.groups[groupIndex];
        config.groups[groupIndex] = new Group(
            group.operation,
            group.filters.filter((_, index) => index !== filterIndex)
        );
    }

    updateConfiguration(configuration: SearchConfigurationDTO) {
        const config = SearchConfiguration.createFrom(configuration);

        this.repository.setSearchConfiguration(config);
    }
}
