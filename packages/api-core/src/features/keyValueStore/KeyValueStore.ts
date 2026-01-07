import { Result } from "@webiny/feature/api";
import { KeyValueStore as ServiceAbstraction } from "./abstractions.js";
import { GlobalKeyValueStore } from "./abstractions.js";
import { TenantContext } from "~/features/tenancy/TenantContext/index.js";

class KeyValueStoreImpl implements ServiceAbstraction.Interface {
    constructor(
        private tenantContext: TenantContext.Interface,
        private globalStore: GlobalKeyValueStore.Interface
    ) {}

    async get<T = unknown>(key: string): Promise<Result<T, ServiceAbstraction.Error>> {
        const tenant = this.tenantContext.getTenant();
        return this.globalStore.get<T>(key, { scope: tenant.id });
    }

    async set(key: string, value: any): Promise<Result<void, ServiceAbstraction.Error>> {
        const tenant = this.tenantContext.getTenant();
        return this.globalStore.set(key, value, { scope: tenant.id });
    }

    async delete(key: string): Promise<Result<void, ServiceAbstraction.Error>> {
        const tenant = this.tenantContext.getTenant();
        return this.globalStore.delete(key, { scope: tenant.id });
    }

    async list(
        keyPrefix: string
    ): Promise<Result<ServiceAbstraction.KeyValueRecord[], ServiceAbstraction.Error>> {
        const tenant = this.tenantContext.getTenant();
        return this.globalStore.list(keyPrefix, { scope: tenant.id });
    }
}

export const KeyValueStore = ServiceAbstraction.createImplementation({
    implementation: KeyValueStoreImpl,
    dependencies: [TenantContext, GlobalKeyValueStore]
});
