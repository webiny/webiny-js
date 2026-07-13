import { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";

/**
 * Shared test tenancy/security constants (the default admin identity + full-access role/team ids).
 * Runtime tenancy/security setup lives in the heavier @webiny/testing harness (TenancyAndSecurity-
 * Feature); these plain constants live here in the base test-utils package.
 */
export const defaultIdentity: IdentityData = {
    id: "id-12345678",
    type: "admin",
    displayName: "John Doe"
};

export const FULL_ACCESS_ROLE_ID = "full-access-role";
export const FULL_ACCESS_TEAM_ID = "full-access-team";
export const UNKNOWN_TEAM_ID = "unknown-team";
