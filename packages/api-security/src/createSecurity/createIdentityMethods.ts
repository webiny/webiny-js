import {
    CreateTenantLinkParams,
    DeleteTenantLinkParams,
    GetTenantLinkByIdentityParams,
    ListTenantLinksByIdentityParams,
    ListTenantLinksByTypeParams,
    ListTenantLinksParams,
    SecurityConfig,
    TenantLink,
    UpdateTenantLinkParams
} from "~/types";

export const createIdentityMethods = ({ storageOperations }: SecurityConfig) => {
    return {
        async createTenantLinks(params: CreateTenantLinkParams[]) {
            await storageOperations.createTenantLinks(params);
        },

        async updateTenantLinks(params: UpdateTenantLinkParams[]) {
            await storageOperations.updateTenantLinks(params);
        },

        async deleteTenantLinks(params: DeleteTenantLinkParams[]) {
            await storageOperations.deleteTenantLinks(params);
        },

        listTenantLinksByType<TLink extends TenantLink = TenantLink>(
            params: ListTenantLinksByTypeParams
        ): Promise<TLink[]> {
            return storageOperations.listTenantLinksByType(params);
        },

        listTenantLinksByTenant(params: ListTenantLinksParams) {
            return storageOperations.listTenantLinksByTenant(params);
        },

        listTenantLinksByIdentity(params: ListTenantLinksByIdentityParams) {
            return storageOperations.listTenantLinksByIdentity(params);
        },

        getTenantLinkByIdentity<TData>(params: GetTenantLinkByIdentityParams) {
            return storageOperations.getTenantLinkByIdentity<TData>(params);
        }
    };
};
