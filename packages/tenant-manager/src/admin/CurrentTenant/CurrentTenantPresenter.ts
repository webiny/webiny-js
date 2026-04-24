import { makeAutoObservable, runInAction } from "mobx";
import {
    CurrentTenantPresenter as PresenterAbstraction,
    CurrentTenantRepository
} from "./abstractions.js";

class CurrentTenantPresenterImpl implements PresenterAbstraction.Interface {
    private loading = false;

    constructor(private repository: CurrentTenantRepository.Interface) {
        makeAutoObservable(this);
    }

    get vm(): PresenterAbstraction.ViewModel {
        return {
            loading: this.loading,
            tenant: this.repository.getTenant(),
            error: this.repository.getError()
        };
    }

    init(): void {
        this.loading = true;
        this.repository.loadTenant().then(() => {
            runInAction(() => {
                this.loading = false;
            });
        });
    }
}

export const CurrentTenantPresenter = PresenterAbstraction.createImplementation({
    implementation: CurrentTenantPresenterImpl,
    dependencies: [CurrentTenantRepository]
});
