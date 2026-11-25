import { type Container, createFeature } from "@webiny/feature/api";
import { TaskCatalogFlpFeature } from "@webiny/api-aco/flpTaskCatalog/index.js";
import { DdbFlpStorageOperations } from "./DdbFlpStorageOperations.js";

export const AcoDdbFeature = createFeature({
    name: "AcoDdb",
    register(container: Container) {
        // Registered once, in the root, and built in each tenant scope with the scope's tenant.
        container.register(DdbFlpStorageOperations).inContainerScope();

        // Folder-level permissions on this storage use the task-maintained FLP catalog.
        TaskCatalogFlpFeature.register(container);
    }
});
