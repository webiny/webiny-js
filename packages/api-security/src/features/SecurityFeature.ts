import { createFeature } from "@webiny/feature/api";
import type { Container } from "@webiny/di-container";
import type { SecurityStorageOperations as ISecurityStorageOperations } from "~/types.js";
import { SecurityStorageOperations } from "./shared/abstractions.js";

import { AuthorizationContextFeature } from "./authorization/AuthorizationContext/index.js";
import { AuthenticationContextFeature } from "./authentication/AuthenticationContext/index.js";
import { IdentityContextFeature } from "./IdentityContext/index.js";
import { ApiKeysFeature } from "./apiKeys/index.js";
import { GroupsFeature } from "./groups/index.js";
import { TeamsFeature } from "./teams/index.js";
import { TenantLinksFeature } from "./tenantLinks/index.js";

/**
 * Setup all security features in the DI container.
 * This is the main entry point for registering all security-related features.
 *
 * @param container - DI container instance
 * @param storageOperations - Storage operations implementation
 */
export const SecurityFeature = createFeature({
    name: "SecurityFeature",
    register(container: Container, storageOperations: ISecurityStorageOperations) {
        // Register storage operations abstraction (singleton)
        container.registerInstance(SecurityStorageOperations, storageOperations);

        AuthorizationContextFeature.register(container);
        AuthenticationContextFeature.register(container);
        IdentityContextFeature.register(container);
        ApiKeysFeature.register(container);
        GroupsFeature.register(container);
        TeamsFeature.register(container);
        TenantLinksFeature.register(container);
    }
});
