import { makeAutoObservable, runInAction } from "mobx";
import {
    NextjsConfigPresenter as PresenterAbstraction,
    NextjsConfigRepository
} from "./abstractions.js";

class NextjsConfigPresenterImpl implements PresenterAbstraction.Interface {
    private loading = false;

    constructor(private repository: NextjsConfigRepository.Interface) {
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

export const NextjsConfigPresenter = PresenterAbstraction.createImplementation({
    implementation: NextjsConfigPresenterImpl,
    dependencies: [NextjsConfigRepository]
});
