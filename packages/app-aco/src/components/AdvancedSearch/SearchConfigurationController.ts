import { makeAutoObservable } from "mobx";

import { Group, ISearchConfigurationRepository } from "./SearchConfiguration";
import { FilterOperation } from "~/components/AdvancedSearch/types";

export class SearchConfigurationController {
    private readonly repository: ISearchConfigurationRepository;

    constructor(repository: ISearchConfigurationRepository) {
        this.repository = repository;
        makeAutoObservable(this);
    }

    setOperation(operation: FilterOperation) {
        this.repository.setOperation(operation);
    }

    addGroup() {
        this.repository.addGroup();
    }

    updateGroup(group: Group) {
        this.repository.updateGroup(group);
    }

    deleteGroup(group: Group) {
        this.repository.deleteGroup(group);
    }
}
