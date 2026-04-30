import type { WebinyConfig } from "./types.js";
import type { CreateTenantParams } from "./methods/tenantManager/createTenant.js";
import type { InstallTenantParams } from "./methods/tenantManager/installTenant.js";
import type { DisableTenantParams } from "./methods/tenantManager/disableTenant.js";
import type { EnableTenantParams } from "./methods/tenantManager/enableTenant.js";
import type { HttpError, ApiError, NetworkError } from "./errors.js";
import type { Result } from "./Result.js";
import { createTenant as createTenantFn } from "./methods/tenantManager/createTenant.js";
import { installTenant as installTenantFn } from "./methods/tenantManager/installTenant.js";
import { disableTenant as disableTenantFn } from "./methods/tenantManager/disableTenant.js";
import { enableTenant as enableTenantFn } from "./methods/tenantManager/enableTenant.js";
import { getCurrentTenant as getCurrentTenantFn } from "./methods/tenantManager/getCurrentTenant.js";
import type { Tenant } from "./methods/tenantManager/getCurrentTenant.js";

export class TenantManagerSdk {
    private config: WebinyConfig;
    private fetchFn: typeof fetch;

    constructor(config: WebinyConfig) {
        this.config = config;
        this.fetchFn = config.fetch || fetch;
    }

    async createTenant(
        params: CreateTenantParams
    ): Promise<Result<boolean, HttpError | ApiError | NetworkError>> {
        return createTenantFn(this.config, this.fetchFn, params);
    }

    async installTenant(
        params: InstallTenantParams
    ): Promise<Result<boolean, HttpError | ApiError | NetworkError>> {
        return installTenantFn(this.config, this.fetchFn, params);
    }

    async disableTenant(
        params: DisableTenantParams
    ): Promise<Result<boolean, HttpError | ApiError | NetworkError>> {
        return disableTenantFn(this.config, this.fetchFn, params);
    }

    async enableTenant(
        params: EnableTenantParams
    ): Promise<Result<boolean, HttpError | ApiError | NetworkError>> {
        return enableTenantFn(this.config, this.fetchFn, params);
    }

    async getCurrentTenant(): Promise<Result<Tenant, HttpError | ApiError | NetworkError>> {
        return getCurrentTenantFn(this.config, this.fetchFn);
    }
}
