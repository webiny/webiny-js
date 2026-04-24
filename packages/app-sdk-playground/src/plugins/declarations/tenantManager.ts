// Tenant Manager SDK type declarations.
export const TENANT_MANAGER_DECLARATIONS = `
interface SdkCreateTenantInput {
    /** Custom tenant ID. If not provided, one will be generated automatically. */
    id?: string;
    /** Display name for the tenant. */
    name: string;
    /** Tenant description. */
    description?: string;
}

interface SdkCreateTenantParams {
    /** The tenant data to create. */
    data: SdkCreateTenantInput;
}

interface SdkInstallTenantParams {
    /** ID of the tenant to install. */
    tenantId: string;
}

interface SdkDisableTenantParams {
    /** ID of the tenant to disable. */
    tenantId: string;
}

interface SdkEnableTenantParams {
    /** ID of the tenant to enable. */
    tenantId: string;
}

interface SdkTenant {
    /** Unique tenant identifier. */
    id: string;
    /** Tenant configuration values. */
    values: Record<string, unknown>;
}

interface SdkTenantManager {
    /** Return the current tenant for the authenticated context. */
    getCurrentTenant(): Promise<SdkResult<SdkTenant, SdkError>>;

    /** Create a new tenant in the system. */
    createTenant(params: SdkCreateTenantParams): Promise<SdkResult<boolean, SdkError>>;

    /** Install and provision a tenant with default settings and configurations. */
    installTenant(params: SdkInstallTenantParams): Promise<SdkResult<boolean, SdkError>>;

    /** Disable a tenant, preventing access to its resources. */
    disableTenant(params: SdkDisableTenantParams): Promise<SdkResult<boolean, SdkError>>;

    /** Re-enable a previously disabled tenant. */
    enableTenant(params: SdkEnableTenantParams): Promise<SdkResult<boolean, SdkError>>;
}
`;
