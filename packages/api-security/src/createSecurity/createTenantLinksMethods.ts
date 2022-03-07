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
        async createTenantLinks(params: CreateTenantLinkParams[]): Promise<void> {
            await storageOperations.createTenantLinks(
                params.map(item => ({
                    ...item,
                    createdOn: new Date().toISOString(),
                    webinyVersion: process.env.WEBINY_VERSION as string
                }))
            );
        },

        async updateTenantLinks(params: UpdateTenantLinkParams[]): Promise<void> {
            await storageOperations.updateTenantLinks(params);
        },

        async deleteTenantLinks(params: DeleteTenantLinkParams[]): Promise<void> {
            await storageOperations.deleteTenantLinks(params);
        },

        async listTenantLinksByType<TLink extends TenantLink = TenantLink>(
            params: ListTenantLinksByTypeParams
        ): Promise<TLink[]> {
            return storageOperations.listTenantLinksByType(params);
        },

        listTenantLinksByTenant(params: ListTenantLinksParams): Promise<TenantLink[]> {
            return storageOperations.listTenantLinksByTenant(params);
        },

        listTenantLinksByIdentity(params: ListTenantLinksByIdentityParams): Promise<TenantLink[]> {
            return storageOperations.listTenantLinksByIdentity(params);
        },

        async getTenantLinkByIdentity<TLink extends TenantLink = TenantLink>(
            params: GetTenantLinkByIdentityParams
        ): Promise<TLink | null> {
            return storageOperations.getTenantLinkByIdentity(params);
        }
    };
};
