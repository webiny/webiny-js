import { makeAutoObservable, runInAction } from "mobx";
import { ListModelsRepository as RepoAbstraction, ListModelsGateway } from "./abstractions.js";
import type { AiModel } from "./abstractions.js";

class ListModelsRepositoryImpl implements RepoAbstraction.Interface {
    private models: AiModel[] = [];

    constructor(private gateway: ListModelsGateway.Interface) {
        makeAutoObservable(this);
    }

    async execute(): Promise<void> {
        const models = await this.gateway.execute();
        runInAction(() => {
            this.models = models;
        });
    }

    getModels(): AiModel[] {
        return this.models;
    }
}

export const ListModelsRepository = RepoAbstraction.createImplementation({
    implementation: ListModelsRepositoryImpl,
    dependencies: [ListModelsGateway]
});
