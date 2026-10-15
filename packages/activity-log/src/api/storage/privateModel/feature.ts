import { type Container, createFeature } from "@webiny/feature/api";
import { ActivityLogModelProvider } from "./ActivityLogModelProvider.js";
import { PrivateModelActivityLogStorage } from "./PrivateModelActivityLogStorage.js";

/**
 * The private-model storage implementation.
 *
 * Registered as its own feature so that swapping in a different storage mechanism means
 * registering a different feature here and touching nothing above `ActivityLogStorage`.
 */
export const PrivateModelStorageFeature = createFeature({
    name: "ActivityLog/PrivateModelStorage",
    register(container: Container) {
        container.register(ActivityLogModelProvider).inSingletonScope();
        container.register(PrivateModelActivityLogStorage).inSingletonScope();
    }
});
