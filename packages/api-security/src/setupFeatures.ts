import type { Container } from "@webiny/di-container";
import type { SecurityStorageOperations as ISecurityStorageOperations } from "./types.js";
import { SecurityStorageOperations } from "./features/shared/abstractions.js";

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

    // Features will be registered here in subsequent phases:
    // - Phase 1: Authentication, Authorization, Identity contexts
    // - Phase 2: API Keys features
    // - Phase 3: Groups features
    // - Phase 4: Teams features
    // - Phase 5: Tenant Links features
};
