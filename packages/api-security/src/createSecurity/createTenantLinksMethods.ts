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

export const createTenantLinksMethods = ({ storageOperations }: SecurityConfig) => {
    return {
        async createTenantLinks(params: CreateTenantLinkParams[]) {
            await storageOperations.createTenantLinks(
                params.map(item => ({
                    ...item,
                    createdOn: new Date().toISOString(),
                    webinyVersion: process.env.WEBINY_VERSION
                }))
            );
        },

        async updateTenantLinks(params: UpdateTenantLinkParams[]) {
            await storageOperations.updateTenantLinks(params);
        },

        async deleteTenantLinks(params: DeleteTenantLinkParams[]) {
            await storageOperations.deleteTenantLinks(params);
        },

        async listTenantLinksByType<TLink extends TenantLink = TenantLink>(
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

        async getTenantLinkByIdentity<TLink extends TenantLink = TenantLink>(
            params: GetTenantLinkByIdentityParams
        ): Promise<TLink> {
            return storageOperations.getTenantLinkByIdentity(params);
        }
    };
};
