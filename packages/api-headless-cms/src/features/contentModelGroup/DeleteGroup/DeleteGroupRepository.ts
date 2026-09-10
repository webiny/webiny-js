import { Result } from "@webiny/feature/api";
import { DeleteGroupRepository as RepositoryAbstraction } from "./abstractions.js";
import { GroupCache } from "~/features/contentModelGroup/shared/abstractions.js";
import { PluginGroupsProvider } from "~/features/contentModelGroup/shared/abstractions.js";
import { GroupCannotDeleteCodeDefinedError } from "~/domain/contentModelGroup/errors.js";
import { GroupHasModelsError } from "~/domain/contentModelGroup/errors.js";
import { GroupPersistenceError } from "~/domain/contentModelGroup/errors.js";
import { DeleteGroupStorageOperation } from "~/features/shared/storageOperations/group/DeleteGroupStorageOperation.js";
import { ListModelsStorageOperation } from "~/features/shared/storageOperations/model/ListModelsStorageOperation.js";
import type { CmsGroup } from "~/types/index.js";

/**
 * DeleteGroupRepository - Validates and performs group deletion.
 *
 * Responsibilities:
 * - Check if group is plugin-based (cannot delete)
 * - Check if models reference this group (cannot delete)
 * - Persist deletion to storage
 * - Clear GroupCache after successful deletion
 */
class DeleteGroupRepositoryImpl implements RepositoryAbstraction.Interface {
    public constructor(
        private groupCache: GroupCache.Interface,
        private pluginGroupsProvider: PluginGroupsProvider.Interface,
        private deleteGroup: DeleteGroupStorageOperation.Interface,
        private listModels: ListModelsStorageOperation.Interface
    ) {}

    async execute(group: CmsGroup): Promise<Result<void, RepositoryAbstraction.Error>> {
        try {
            // Check if this is a plugin-based group (cannot be deleted)
            const pluginGroups = await this.pluginGroupsProvider.getGroups();
            const isPluginGroup = pluginGroups.some(pg => pg.slug === group.slug);

            if (isPluginGroup) {
                return Result.fail(new GroupCannotDeleteCodeDefinedError(group.id));
            }

            // Check if any models reference this group
            const models = await this.listModels.execute({
                where: {
                    tenant: group.tenant
                }
            });

            const items = models.filter(model => model.group === group.slug);
            if (items.length > 0) {
                return Result.fail(new GroupHasModelsError());
            }

            // Perform deletion
            await this.deleteGroup.execute({ group });

            // Clear cache
            this.groupCache.clear();

            return Result.ok();
        } catch (error) {
            return Result.fail(new GroupPersistenceError(error as Error));
        }
    }
}

export const DeleteGroupRepository = RepositoryAbstraction.createImplementation({
    implementation: DeleteGroupRepositoryImpl,
    dependencies: [
        GroupCache,
        PluginGroupsProvider,
        DeleteGroupStorageOperation,
        ListModelsStorageOperation
    ]
});
