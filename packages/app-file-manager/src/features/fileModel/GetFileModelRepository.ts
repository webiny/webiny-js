import { makeAutoObservable, runInAction } from "mobx";
import type { CmsModel } from "@webiny/app-headless-cms-common/types/index.js";
import {
    GetFileModelRepository as RepositoryAbstraction,
    GetFileModelGateway
} from "./abstractions.js";

class GetFileModelRepositoryImpl implements RepositoryAbstraction.Interface {
    private model: CmsModel | undefined;

    constructor(private gateway: GetFileModelGateway.Interface) {
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

export const GetFileModelRepository = RepositoryAbstraction.createImplementation({
    implementation: GetFileModelRepositoryImpl,
    dependencies: [GetFileModelGateway]
});
