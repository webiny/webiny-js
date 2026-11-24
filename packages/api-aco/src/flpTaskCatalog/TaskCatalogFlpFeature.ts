import { createFeature } from "@webiny/feature/api";
import type { Container } from "@webiny/di";
import { FlpCrud } from "./FlpCrud.js";
import { CreateFlpUseCase } from "./useCases/CreateFlpUseCase.js";
import { UpdateFlpUseCase } from "./useCases/UpdateFlpUseCase.js";
import { DeleteFlpUseCase } from "./useCases/DeleteFlpUseCase.js";
import { CreateFlpTask } from "./tasks/createFlp.task.js";
import { UpdateFlpTask } from "./tasks/updateFlp.task.js";
import { DeleteFlpTask } from "./tasks/deleteFlp.task.js";
import { SyncFlpTask } from "./tasks/syncFlp.task.js";
import { CatalogFolderPermissionsRepository } from "./CatalogFolderPermissionsRepository.js";
import { TaskFolderCatalogSync } from "./TaskFolderCatalogSync.js";
import { PostLoadFolderAccessListFilter } from "./PostLoadFolderAccessListFilter.js";

/**
 * The FLP strategy built on a catalog: one record per folder with the inherited permissions copied
 * in, kept in step with folder changes by background tasks, and lists filtered after loading.
 *
 * Storages register it next to their `FlpStorageOperations`. `AcoFeature` does not register any
 * FLP strategy, so a setup without one fails at the first permission check.
 */
export const TaskCatalogFlpFeature = createFeature({
    name: "Aco/TaskCatalogFlp",
    register(container: Container) {
        /*
         * The catalog and the writes to it. A storage may register this feature in the root container
         * (DynamoDB does), where no tenant, identity or CMS use case exists. These are container
         * registrations and not factory closures over `container`, so their dependencies come from
         * the request container that resolves them.
         */
        container.register(FlpCrud);
        container.register(CreateFlpUseCase);
        container.register(UpdateFlpUseCase);
        container.register(DeleteFlpUseCase);

        // Background tasks that keep the catalog in step.
        container.register(CreateFlpTask);
        container.register(UpdateFlpTask);
        container.register(DeleteFlpTask);
        container.register(SyncFlpTask);

        // The strategy itself.
        container.register(CatalogFolderPermissionsRepository);
        container.register(TaskFolderCatalogSync);
        container.register(PostLoadFolderAccessListFilter);
    }
});
