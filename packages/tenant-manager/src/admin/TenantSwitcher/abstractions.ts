import { createAbstraction } from "@webiny/feature/admin";
import type { Tenant } from "../../shared/Tenant.js";

export interface ITenantListGateway {
    /**
     * The enabled, installed tenants under the root tenant, sorted by name.
     */
    listTenants(search?: string): Promise<Tenant[]>;
}

export const TenantListGateway = createAbstraction<ITenantListGateway>("TenantListGateway");

export namespace TenantListGateway {
    export type Interface = ITenantListGateway;
}
