import type { Container } from "@webiny/di-container";
import type { SecurityStorageOperations as ISecurityStorageOperations } from "./types.js";
import { SecurityStorageOperations } from "./features/shared/abstractions.js";

import { AuthorizationContextFeature } from "./features/authorization/AuthorizationContext/feature.js";
import { AuthenticationContextFeature } from "~/features/authentication/AuthenticationContext/feature.js";
import { IdentityContextFeature } from "./features/IdentityContext/feature.js";
import { ApiKeysFeature } from "./features/apiKeys/feature.js";
import { GroupsFeature } from "./features/groups/feature.js";
import { TeamsFeature } from "./features/teams/feature.js";
import { TenantLinksFeature } from "./features/tenantLinks/feature.js";

/**
 * Setup all security features in the DI container.
 * This is the main entry point for registering all security-related features.
 *
 * @param container - DI container instance
 * @param storageOperations - Storage operations implementation
 */
export const setupFeatures = (
    container: Container,
    storageOperations: ISecurityStorageOperations
) => {
    // Register storage operations abstraction (singleton)
    container.registerInstance(SecurityStorageOperations, storageOperations);

    // Phase 1: Register core contexts (order matters for dependencies)
    AuthorizationContextFeature.register(container);
    AuthenticationContextFeature.register(container);
    IdentityContextFeature.register(container);

    // Phase 2: API Keys features
    ApiKeysFeature.register(container);

    // Phase 3: Groups features
    GroupsFeature.register(container);

    // Phase 4: Teams features
    TeamsFeature.register(container);

    // Phase 5: Tenant Links features
    TenantLinksFeature.register(container);
};
