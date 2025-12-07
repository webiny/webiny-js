import { makeAutoObservable, runInAction } from "mobx";
import {
    GetFolderModelRepository as RepositoryAbstraction,
    GetFolderModelGateway
} from "./abstractions.js";
import type { FolderModelDto } from "./FolderModelDto.js";

class GetFolderModelRepositoryImpl implements RepositoryAbstraction.Interface {
    private model: FolderModelDto | undefined;

    constructor(private gateway: GetFolderModelGateway.Interface) {
        this.model = undefined;
        makeAutoObservable(this);
    }

    async load() {
        if (!this.hasModel()) {
            const model = await this.gateway.execute();
            runInAction(() => {
                this.model = model;
            });
        }
    }

    getModel() {
        return this.model;
    }

    hasModel() {
        return Boolean(this.model);
    }
}

export const GetFolderModelRepository = RepositoryAbstraction.createImplementation({
    implementation: GetFolderModelRepositoryImpl,
    dependencies: [GetFolderModelGateway]
});
