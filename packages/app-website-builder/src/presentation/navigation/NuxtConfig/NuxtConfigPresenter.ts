import { makeAutoObservable, runInAction } from "mobx";
import {
    NuxtConfigPresenter as PresenterAbstraction,
    NuxtConfigRepository
} from "./abstractions.js";

class NuxtConfigPresenterImpl implements PresenterAbstraction.Interface {
    private loading = false;

    constructor(private repository: NuxtConfigRepository.Interface) {
        makeAutoObservable(this);
    }

    get vm(): PresenterAbstraction.ViewModel {
        return {
            loading: this.loading,
            config: this.repository.getConfig()
        };
    }

    init(): void {
        this.loading = true;
        this.repository.loadConfig().then(() => {
            runInAction(() => {
                this.loading = false;
            });
        });
    }
}

export const NuxtConfigPresenter = PresenterAbstraction.createImplementation({
    implementation: NuxtConfigPresenterImpl,
    dependencies: [NuxtConfigRepository]
});
