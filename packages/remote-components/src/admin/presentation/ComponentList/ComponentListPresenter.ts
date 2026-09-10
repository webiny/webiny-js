import { makeAutoObservable, runInAction } from "mobx";
import { ComponentListPresenter as PresenterAbstraction } from "./abstractions.js";
import { RemoteComponentGateway } from "~/admin/features/shared/abstractions.js";

class ComponentListPresenterImpl implements PresenterAbstraction.Interface {
    vm: PresenterAbstraction.ViewModel = {
        loading: false,
        components: [],
        error: null
    };

    constructor(private gateway: RemoteComponentGateway.Interface) {
        makeAutoObservable(this);
    }

    async init() {
        runInAction(() => {
            this.vm.loading = true;
            this.vm.error = null;
        });

        try {
            const result = await this.gateway.list();
            runInAction(() => {
                this.vm.components = result.items;
                this.vm.loading = false;
            });
        } catch (error) {
            runInAction(() => {
                this.vm.error = (error as Error).message;
                this.vm.loading = false;
            });
        }
    }

    async deleteComponent(id: string) {
        try {
            await this.gateway.remove(id);
            runInAction(() => {
                this.vm.components = this.vm.components.filter(c => c.id !== id);
            });
        } catch (error) {
            runInAction(() => {
                this.vm.error = (error as Error).message;
            });
        }
    }
}

export const ComponentListPresenter = PresenterAbstraction.createImplementation({
    implementation: ComponentListPresenterImpl,
    dependencies: [RemoteComponentGateway]
});
