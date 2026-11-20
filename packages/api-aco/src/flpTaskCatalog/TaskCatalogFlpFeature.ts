import { createFeature } from "@webiny/feature/api";
import type { Container } from "@webiny/di";
import type { Tenant } from "@webiny/api-core/types/tenancy.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/abstractions.js";
import { UpdateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/UpdateEntry/index.js";
import { AcoFlpCrud, FlpStorageOperations } from "~/features/folder/shared/abstractions.js";
import { CreateFlpUseCase as CreateFlpUseCaseAbstraction } from "~/features/flp/CreateFlp/abstractions.js";
import { UpdateFlpUseCase as UpdateFlpUseCaseAbstraction } from "~/features/flp/UpdateFlp/abstractions.js";
import { DeleteFlpUseCase as DeleteFlpUseCaseAbstraction } from "~/features/flp/DeleteFlp/abstractions.js";
import { ListFoldersUseCase } from "~/features/folder/ListFolders/abstractions.js";
import { FolderModelProvider } from "~/domain/folder/abstractions.js";
import { createFlpCrudMethods } from "./flp.crud.js";
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
        // The catalog. Built on first resolve (post-auth), memoised per container.
        let flpCrudMethods: ReturnType<typeof createFlpCrudMethods> | undefined;
        container.registerFactory(AcoFlpCrud, () => {
            if (!flpCrudMethods) {
                flpCrudMethods = createFlpCrudMethods({
                    getTenant: (): Tenant => container.resolve(TenantContext).getTenant(),
                    storageOperations: { flp: container.resolve(FlpStorageOperations) }
                });
            }
            return flpCrudMethods;
        });

        // Writes to the catalog.
        container.registerFactory(CreateFlpUseCaseAbstraction, () => {
            return new CreateFlpUseCase(container.resolve(AcoFlpCrud));
        });
        container.registerFactory(UpdateFlpUseCaseAbstraction, () => {
            return new UpdateFlpUseCase(
                container.resolve(AcoFlpCrud),
                container.resolve(ListFoldersUseCase),
                container.resolve(FolderModelProvider),
                container.resolve(UpdateEntryUseCase),
                container.resolve(IdentityContext)
            );
        });
        container.registerFactory(DeleteFlpUseCaseAbstraction, () => {
            return new DeleteFlpUseCase(container.resolve(AcoFlpCrud));
        });

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
