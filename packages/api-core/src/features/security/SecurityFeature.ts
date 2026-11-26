import { createFeature } from "@webiny/feature/api";
import type { Container } from "@webiny/di";
import type { SecurityStorageOperations as ISecurityStorageOperations } from "~/types/security.js";
import { SecurityStorageOperations } from "./shared/abstractions.js";
import { AuthenticationContextFeature } from "./authentication/AuthenticationContext/index.js";
import { AuthorizationContextFeature } from "./authorization/AuthorizationContext/index.js";
import { GroupsTeamsAuthorizerFeature } from "./authorization/GroupsTeamsAuthorizer/feature.js";
import { IdentityContextFeature } from "./IdentityContext/index.js";
import { ApiKeysFeature } from "./apiKeys/feature.js";
import { TeamsFeature } from "./teams/feature.js";
import { RolesFeature } from "~/features/security/roles/feature.js";
import { SecurityAiToolsFeature } from "./ai/feature.js";
import { CanAccessCurrentTenantFeature } from "./CanAccessCurrentTenant/index.js";
import { ResolveIdentityTenantsFeature } from "./ResolveIdentityTenants/feature.js";
import { LogInFeature } from "./login/feature.js";

/**
 * Setup all security features in the DI container.
 * This is the main entry point for registering all security-related features.
 *
 * @param container - DI container instance
 * @param storageOperations - Storage operations implementation. Omitted, the caller registers
 * `SecurityStorageOperations` (`ApiCoreFeature` serves it from the tenant scope's core storage).
 */
export const SecurityFeature = createFeature<ISecurityStorageOperations | undefined>({
    name: "SecurityFeature",
    register(container: Container, storageOperations?: ISecurityStorageOperations) {
        if (storageOperations) {
            container.registerInstance(SecurityStorageOperations, storageOperations);
        }

        AuthorizationContextFeature.register(container);
        AuthenticationContextFeature.register(container);
        IdentityContextFeature.register(container);
        CanAccessCurrentTenantFeature.register(container);
        ApiKeysFeature.register(container);
        RolesFeature.register(container);
        TeamsFeature.register(container);
        GroupsTeamsAuthorizerFeature.register(container);
        SecurityAiToolsFeature.register(container);
        ResolveIdentityTenantsFeature.register(container);
        LogInFeature.register(container);
    }
});
