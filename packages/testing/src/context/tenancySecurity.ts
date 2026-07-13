import { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";

/**
 * Shared test tenancy/security constants. The runtime setup (tenants, role/team factories,
 * authenticator/authorizer, identity) is DI-native via `TenancyAndSecurityFeature` — the legacy
 * `createTenancyAndSecurity` plugins were removed.
 */
export const defaultIdentity: IdentityData = {
    id: "id-12345678",
    type: "admin",
    displayName: "John Doe"
};

export const FULL_ACCESS_ROLE_ID = "full-access-role";
export const FULL_ACCESS_TEAM_ID = "full-access-team";
export const UNKNOWN_TEAM_ID = "unknown-team";
