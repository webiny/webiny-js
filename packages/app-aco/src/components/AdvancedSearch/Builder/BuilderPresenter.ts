import { makeAutoObservable } from "mobx";
import { IBuilderRepository } from "./BuilderRepository";
import { SearchConfigurationMapper } from "./SearchConfigurationMapper";

export class BuilderPresenter {
    private readonly repository: IBuilderRepository;

    constructor(repository: IBuilderRepository) {
        this.repository = repository;
        makeAutoObservable(this);
    }

    get viewModel() {
        const configuration = this.repository.getSearchConfiguration();

        return {
            operations: Object.values(configuration.operations),
            configuration: SearchConfigurationMapper.toDTO(configuration)
        };
    }
}
