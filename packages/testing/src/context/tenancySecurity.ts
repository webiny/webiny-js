/**
 * Shared test tenancy/security constants now live in the base @webiny/api-core-testing package; re-exported
 * here for existing consumers. Runtime setup is DI-native via `TenancyAndSecurityFeature`.
 */
export {
    defaultIdentity,
    FULL_ACCESS_ROLE_ID,
    FULL_ACCESS_TEAM_ID,
    UNKNOWN_TEAM_ID
} from "@webiny/api-core-testing";
