import { makeAutoObservable } from "mobx";
import {
    ISearchConfigurationRepository,
    SearchConfiguration,
    SearchConfigurationDTO
} from "./SearchConfiguration";

export class SearchConfigurationController {
    private readonly repository: ISearchConfigurationRepository;

    constructor(repository: ISearchConfigurationRepository) {
        this.repository = repository;
        makeAutoObservable(this);
    }

    updateConfiguration(configuration: SearchConfigurationDTO) {
        const config = SearchConfiguration.createFrom(configuration);

        this.repository.setSearchConfiguration(config);
    }
}
