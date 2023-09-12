import { makeAutoObservable } from "mobx";
import { SearchConfiguration } from "./SearchConfiguration";

export interface IBuilderRepository {
    getSearchConfiguration(): SearchConfiguration;
    setSearchConfiguration(configuration: SearchConfiguration): void;
}

class BuilderRepository implements IBuilderRepository {
    private searchConfiguration: SearchConfiguration;

    constructor() {
        this.searchConfiguration = SearchConfiguration.createEmpty();
        makeAutoObservable(this);
    }

    getSearchConfiguration() {
        return this.searchConfiguration;
    }

    setSearchConfiguration(configuration: SearchConfiguration) {
        this.searchConfiguration = configuration;
    }
}

export const builderRepository = new BuilderRepository();
