import { Security } from "../Security";
import {
    CreateTenantLinkParams,
    DeleteTenantLinkParams,
    GetTenantLinkByIdentityParams,
    IdentityStorageOperations,
    IdentityStorageOperationsFactory,
    ListTenantLinksByIdentityParams,
    ListTenantLinksByTypeParams,
    ListTenantLinksParams,
    TenantLink,
    UpdateTenantLinkParams
} from "../types";

export class Identity {
    private security: Security;
    private storage: IdentityStorageOperations;

    constructor(security: Security) {
        this.security = security;
    }

    setStorageOperations(storageFactory: IdentityStorageOperationsFactory) {
        this.storage = storageFactory({
            tenant: this.security.getTenant(),
            plugins: this.security.getPlugins()
        });
    }

    async createTenantLinks(params: CreateTenantLinkParams[]) {
        await this.storage.createTenantLinks(params);
    }

    async updateTenantLinks(params: UpdateTenantLinkParams[]) {
        await this.storage.updateTenantLinks(params);
    }

    async deleteTenantLinks(params: DeleteTenantLinkParams[]) {
        await this.storage.deleteTenantLinks(params);
    }

    listTenantLinksByType<TLink extends TenantLink = TenantLink>(
        params: ListTenantLinksByTypeParams
    ): Promise<TLink[]> {
        return this.storage.listTenantLinksByType(params);
    }

    listTenantLinksByTenant(params: ListTenantLinksParams) {
        return this.storage.listTenantLinksByTenant(params);
    }

    listTenantLinksByIdentity(params: ListTenantLinksByIdentityParams) {
        return this.storage.listTenantLinksByIdentity(params);
    }

    getTenantLinkByIdentity<TData>(params: GetTenantLinkByIdentityParams) {
        return this.storage.getTenantLinkByIdentity<TData>(params);
    }
}
