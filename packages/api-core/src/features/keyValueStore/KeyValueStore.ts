import { Result } from "@webiny/feature/api";
import { KeyValueStore as ServiceAbstraction } from "./abstractions.js";
import { GlobalKeyValueStore } from "./abstractions.js";
import type { IKeyValueSetOptions } from "./abstractions.js";
import type { IKeyValueDeleteCondition } from "./abstractions.js";
import type { IKeyValueListParams } from "./abstractions.js";
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

    async set(
        key: string,
        value: any,
        options?: IKeyValueSetOptions
    ): Promise<Result<void, ServiceAbstraction.Error>> {
        const tenant = this.tenantContext.getTenant();
        return this.globalStore.set(key, value, {
            scope: tenant.id,
            collection: options?.collection,
            ifAbsent: options?.ifAbsent,
            ifValue: options?.ifValue
        });
    }

    async delete(
        key: string,
        options?: IKeyValueDeleteCondition
    ): Promise<Result<void, ServiceAbstraction.Error>> {
        const tenant = this.tenantContext.getTenant();
        return this.globalStore.delete(key, { scope: tenant.id, ifValue: options?.ifValue });
    }

    async list<T = unknown>(
        params: IKeyValueListParams
    ): Promise<Result<ServiceAbstraction.ListResult<T>, ServiceAbstraction.Error>> {
        const tenant = this.tenantContext.getTenant();
        return this.globalStore.list<T>({ ...params, scope: tenant.id });
    }
}

export const KeyValueStore = ServiceAbstraction.createImplementation({
    implementation: KeyValueStoreImpl,
    dependencies: [TenantContext, GlobalKeyValueStore]
});
