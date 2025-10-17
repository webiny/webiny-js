export interface TenantDomain {
    fqdn: string;
}

export interface TenantSettings {
    domains: TenantDomain[];
}

export interface Tenant {
    id: string;
    name: string;
    description: string;
    image?: string;
    tags: string[];
    status: string;
    isInstalled: boolean;
    settings: TenantSettings;
    parent: string | null;
    webinyVersion?: string;
    createdOn: string;
    savedOn: string;
}

export interface CreateTenantInput {
    id?: string;
    name: string;
    description: string;
    image?: string;
    tags: string[];
    status?: string;
    settings?: TenantSettings;
    parent: string;
}

export interface ListTenantsParams {
    parent?: string;
}

export interface TenancyStorageOperations {
    getTenantsByIds(ids: readonly string[]): Promise<Tenant[]>;
    listTenants(params?: ListTenantsParams): Promise<Tenant[]>;
    createTenant(data: Tenant): Promise<Tenant>;
    updateTenant(data: Tenant): Promise<Tenant>;
    deleteTenant(id: string): Promise<void>;
}
