import mdbid from "mdbid";
import {
    CreateTenantInput,
    Tenant,
    TenantAfterCreateCallback,
    TenantAfterDeleteCallback,
    TenantAfterUpdateCallback,
    TenantBeforeCreateCallback,
    TenantBeforeDeleteCallback,
    TenantBeforeUpdateCallback,
    TenantsStorageOperations,
    TenantsStorageOperationsFactory
} from "~/types";
import { TenantsLoaders } from "./TenantsLoaders";
import { Tenancy } from "~/Tenancy";

export class Tenants {
    protected loaders: TenantsLoaders;
    protected storage: TenantsStorageOperations;
    protected tenancy: Tenancy;
    protected beforeCreate: TenantBeforeCreateCallback[] = [];
    protected afterCreate: TenantAfterCreateCallback[] = [];
    protected beforeUpdate: TenantBeforeUpdateCallback[] = [];
    protected afterUpdate: TenantAfterUpdateCallback[] = [];
    protected beforeDelete: TenantBeforeDeleteCallback[] = [];
    protected afterDelete: TenantAfterDeleteCallback[] = [];

    constructor(tenancy: Tenancy) {
        this.tenancy = tenancy;
        this.loaders = new TenantsLoaders();
    }

    setStorageOperations(factory: TenantsStorageOperationsFactory) {
        this.storage = factory({ plugins: this.tenancy.getPlugins() });
        this.loaders.setStorageOperations(this.storage);
    }

    onBeforeCreate(cb: TenantBeforeCreateCallback) {
        this.beforeCreate.push(cb);
    }

    onAfterCreate(cb: TenantAfterCreateCallback) {
        this.afterCreate.push(cb);
    }

    onBeforeUpdate(cb: TenantBeforeUpdateCallback) {
        this.beforeUpdate.push(cb);
    }

    onAfterUpdate(cb: TenantAfterUpdateCallback) {
        this.afterUpdate.push(cb);
    }

    onBeforeDelete(cb: TenantBeforeDeleteCallback) {
        this.beforeDelete.push(cb);
    }

    onAfterDelete(cb: TenantAfterDeleteCallback) {
        this.afterDelete.push(cb);
    }

    async getRootTenant() {
        return this.loaders.getTenant.load("root");
    }

    getTenantById<TTenant extends Tenant = Tenant>(id: string): Promise<TTenant> {
        return this.loaders.getTenant.load(id);
    }

    async listTenants<TTenant extends Tenant = Tenant>({ parent }): Promise<TTenant[]> {
        return this.storage.listTenants({ parent });
    }

    async createTenant<TTenant extends Tenant = Tenant>(data: CreateTenantInput) {
        const tenant = {
            ...data,
            id: data.id ?? mdbid()
        };

        for (const cb of this.beforeCreate) {
            await cb({ tenant });
        }

        await this.storage.createTenant(tenant);

        for (const cb of this.afterCreate) {
            await cb({ tenant });
        }

        // Store data in cache
        this.loaders.getTenant.clear(tenant.id).prime(tenant.id, tenant);

        return tenant as TTenant;
    }

    async updateTenant<TTenant extends Tenant = Tenant>(id: string, data: Partial<TTenant>) {
        const tenant = await this.getTenantById(id);
        const updateData = { ...data };

        for (const cb of this.beforeUpdate) {
            await cb({ tenant, inputData: data, updateData });
        }

        Object.assign(tenant, updateData);

        await this.storage.updateTenant(tenant);

        for (const cb of this.afterUpdate) {
            await cb({ tenant, inputData: data });
        }

        // Update data in cache
        this.loaders.getTenant.clear(id).prime(id, tenant);

        return tenant as TTenant;
    }

    async deleteTenant(id: string) {
        const tenant = await this.getTenantById(id);

        for (const cb of this.beforeDelete) {
            await cb({ tenant });
        }

        await this.storage.deleteTenant(id);

        for (const cb of this.afterDelete) {
            await cb({ tenant });
        }

        // Remove from cache
        this.loaders.getTenant.clear(id).prime(id, undefined);

        return true;
    }
}
