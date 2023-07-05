import { TenantLink } from "../types";

export const isMigratedTenantLink = (tenantLink: TenantLink): boolean => {
    return tenantLink.type === "permissions";
};
