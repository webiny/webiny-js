import type { Identity } from "~/domain/Identity.js";
import type { Tenant } from "~/features/tenancy/abstractions.js";

export interface IdentityDTO {
    id: string;
    type: string;
    displayName: string;
    profile: Identity.Profile;
    permissions: Identity.Permission[];
    currentTenant: Tenant;
    defaultTenant: Tenant;
}
