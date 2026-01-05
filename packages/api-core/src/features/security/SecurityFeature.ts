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
        RolesFeature.register(container);
        TeamsFeature.register(container);
        GroupsTeamsAuthorizerFeature.register(container);
    }
});
