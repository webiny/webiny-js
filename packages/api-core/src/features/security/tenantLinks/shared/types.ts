export interface CreateTenantLinkInput<TData = Record<string, any>> {
    identity: string;
    tenant: string;
    type: string;
    data?: TData;
}

export interface UpdateTenantLinkInput<TData = Record<string, any>> {
    identity: string;
    tenant: string;
    type: string;
    data?: TData;
}

export interface DeleteTenantLinkInput {
    identity: string;
    tenant: string;
}

export interface ListTenantLinksByTypeInput {
    tenant: string;
    type: string;
}

export interface ListTenantLinksByTenantInput {
    tenant: string;
}

export interface ListTenantLinksByIdentityInput {
    identity: string;
}

export interface GetTenantLinkByIdentityInput {
    identity: string;
    tenant: string;
}

export interface TenantLink<TData = any> {
    createdOn: string;
    identity: string;
    tenant: string;
    type: string;
    data?: TData;
    webinyVersion: string;
}
