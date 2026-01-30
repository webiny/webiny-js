import { makeAutoObservable, runInAction } from "mobx";
import {
    CurrentTenantRepository as RepositoryAbstraction,
    CurrentTenantGateway
} from "./abstractions.js";
import type { Tenant } from "../../shared/Tenant.js";

class CurrentTenantRepositoryImpl implements RepositoryAbstraction.Interface {
    private tenant: Tenant | undefined = undefined;
    private error: Error | undefined = undefined;

    constructor(private gateway: CurrentTenantGateway.Interface) {
        makeAutoObservable(this);
    }

    getTenant(): Tenant | undefined {
        return this.tenant;
    }

    getError(): Error | undefined {
        return this.error;
    }

    async loadTenant(): Promise<void> {
        if (this.tenant) {
            return;
        }

        try {
            const tenant = await this.gateway.getTenant();
            runInAction(() => {
                this.tenant = tenant;
            });
        } catch (err) {
            runInAction(() => {
                this.error = err instanceof Error ? err : new Error(String(err));
            });
        }
    }
}

export const CurrentTenantRepository = RepositoryAbstraction.createImplementation({
    implementation: CurrentTenantRepositoryImpl,
    dependencies: [CurrentTenantGateway]
});
